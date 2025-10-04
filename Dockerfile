# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /code

# Copy everything
COPY . /code

# Install dependencies
RUN pip install --no-cache-dir -r backend/app/requirements.txt || \
    pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 7860

# Run FastAPI app
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
