import os
import json
from typing import Dict, Any, List
import mimetypes

# Pandas for Excel parsing
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

# PDF parsing
try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False

# Word parsing
try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

# Excel parsing with openpyxl (alternative to pandas)
try:
    import openpyxl
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False

async def parse_pdf(file_path: str) -> Dict[str, Any]:
    """Parse PDF file and extract text"""
    if not PDF_AVAILABLE:
        return {"error": "PDF parsing not available. Install PyPDF2: pip install PyPDF2"}
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            pages = []
            full_text = ""
            
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                pages.append({
                    "page_number": page_num + 1,
                    "content": page_text
                })
                full_text += page_text + "\n"
            
            return {
                "type": "pdf",
                "total_pages": len(pdf_reader.pages),
                "content": full_text.strip(),
                "pages": pages,
                "metadata": {
                    "file_name": os.path.basename(file_path),
                    "file_size": os.path.getsize(file_path)
                }
            }
    
    except Exception as e:
        return {"error": f"PDF parsing failed: {str(e)}"}

async def parse_docx(file_path: str) -> Dict[str, Any]:
    """Parse Word document and extract text"""
    if not DOCX_AVAILABLE:
        return {"error": "Word parsing not available. Install python-docx: pip install python-docx"}
    
    try:
        doc = Document(file_path)
        paragraphs = []
        full_text = ""
        
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
                full_text += para.text + "\n"
        
        # Extract tables if any
        tables = []
        for table in doc.tables:
            table_data = []
            for row in table.rows:
                row_data = [cell.text for cell in row.cells]
                table_data.append(row_data)
            tables.append(table_data)
        
        return {
            "type": "docx",
            "content": full_text.strip(),
            "paragraphs": paragraphs,
            "tables": tables,
            "metadata": {
                "file_name": os.path.basename(file_path),
                "file_size": os.path.getsize(file_path),
                "paragraph_count": len(paragraphs),
                "table_count": len(tables)
            }
        }
    
    except Exception as e:
        return {"error": f"Word document parsing failed: {str(e)}"}

async def parse_excel(file_path: str) -> Dict[str, Any]:
    """Parse Excel file and extract data"""
    if PANDAS_AVAILABLE:
        # Use pandas if available
        try:
            excel_file = pd.ExcelFile(file_path)
            sheets_data = {}
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                
                sheets_data[sheet_name] = {
                    "columns": df.columns.tolist(),
                    "data": df.fillna("").to_dict('records'),
                    "shape": {
                        "rows": len(df),
                        "columns": len(df.columns)
                    }
                }
            
            return {
                "type": "excel",
                "sheets": sheets_data,
                "sheet_names": excel_file.sheet_names,
                "metadata": {
                    "file_name": os.path.basename(file_path),
                    "file_size": os.path.getsize(file_path),
                    "sheet_count": len(excel_file.sheet_names)
                }
            }
        except Exception as e:
            return {"error": f"Excel parsing with pandas failed: {str(e)}"}
    
    elif EXCEL_AVAILABLE:
        # Fallback to openpyxl
        try:
            workbook = openpyxl.load_workbook(file_path)
            sheets_data = {}
            
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                data = []
                columns = []
                
                # Get column headers from first row
                for cell in sheet[1]:
                    columns.append(cell.value if cell.value is not None else "")
                
                # Get data from remaining rows
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    row_data = {}
                    for i, value in enumerate(row):
                        if i < len(columns):
                            row_data[columns[i]] = value if value is not None else ""
                    data.append(row_data)
                
                sheets_data[sheet_name] = {
                    "columns": columns,
                    "data": data,
                    "shape": {
                        "rows": len(data),
                        "columns": len(columns)
                    }
                }
            
            return {
                "type": "excel",
                "sheets": sheets_data,
                "sheet_names": list(workbook.sheetnames),
                "metadata": {
                    "file_name": os.path.basename(file_path),
                    "file_size": os.path.getsize(file_path),
                    "sheet_count": len(workbook.sheetnames)
                }
            }
        except Exception as e:
            return {"error": f"Excel parsing with openpyxl failed: {str(e)}"}
    
    else:
        return {"error": "Excel parsing not available. Install pandas or openpyxl: pip install pandas openpyxl"}

async def parse_text(file_path: str) -> Dict[str, Any]:
    """Parse plain text file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        lines = content.split('\n')
        
        return {
            "type": "text",
            "content": content,
            "lines": lines,
            "metadata": {
                "file_name": os.path.basename(file_path),
                "file_size": os.path.getsize(file_path),
                "line_count": len(lines),
                "character_count": len(content)
            }
        }
    
    except Exception as e:
        return {"error": f"Text file parsing failed: {str(e)}"}

async def run_document_parser_node(node_data: Dict[str, Any]) -> str:
    """Main function for document parser node"""
    try:
        file_path = node_data.get("file_path", "")
        
        if not file_path or not os.path.exists(file_path):
            return "Error: No valid file path provided"
        
        # Detect file type
        mime_type, _ = mimetypes.guess_type(file_path)
        file_ext = os.path.splitext(file_path)[1].lower()
        
        print(f"📄 Parsing document: {file_path}")
        print(f"📋 File type: {file_ext}, MIME: {mime_type}")
        
        # Route to appropriate parser
        if file_ext == '.pdf':
            result = await parse_pdf(file_path)
        elif file_ext in ['.docx', '.doc']:
            result = await parse_docx(file_path)
        elif file_ext in ['.xlsx', '.xls']:
            result = await parse_excel(file_path)
        elif file_ext in ['.txt', '.md', '.csv']:
            result = await parse_text(file_path)
        else:
            return f"Error: Unsupported file type: {file_ext}"
        
        if "error" in result:
            return result["error"]
        
        # Save parsed data to JSON file for downstream nodes
        output_filename = f"parsed_{os.path.splitext(os.path.basename(file_path))[0]}.json"
        output_path = os.path.join("generated_images", output_filename)  # Reuse existing directory
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Document parsed successfully. JSON saved to: {output_path}")
        
        return f"Document parsed: {output_path}"
    
    except Exception as e:
        return f"Document parsing failed: {str(e)}"
