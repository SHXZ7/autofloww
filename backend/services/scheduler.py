from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta
import asyncio
from typing import Dict, Any, List
from app.core.runner import run_workflow_engine  

# Global scheduler instance
scheduler = BackgroundScheduler()
scheduler.start()

def schedule_workflow(workflow_id: str, trigger_type: str, trigger_config: Dict[str, Any], workflow_executor) -> str:
    """Schedule a workflow with different trigger types"""
    try:
        print(f"📅 Scheduling workflow {workflow_id} with {trigger_type} trigger")
        
        # Remove existing job if it exists
        try:
            scheduler.remove_job(workflow_id)
            print(f"🗑️ Removed existing schedule for {workflow_id}")
        except:
            pass  # Job doesn't exist
        
        # Create trigger based on type
        if trigger_type == "cron":
            # Cron expression: "minute hour day month day_of_week"
            cron_expr = trigger_config.get("expression", "0 9 * * *")  # Default: 9 AM daily
            trigger = CronTrigger.from_crontab(cron_expr)
            
        elif trigger_type == "interval":
            # Interval trigger: run every X minutes/hours/days
            interval_unit = trigger_config.get("unit", "minutes")  # minutes, hours, days
            interval_value = trigger_config.get("value", 60)  # Default: 60 minutes
            
            if interval_unit == "minutes":
                trigger = IntervalTrigger(minutes=interval_value)
            elif interval_unit == "hours":
                trigger = IntervalTrigger(hours=interval_value)
            elif interval_unit == "days":
                trigger = IntervalTrigger(days=interval_value)
            else:
                return f"Error: Unsupported interval unit: {interval_unit}"
                
        elif trigger_type == "date":
            # One-time execution at specific date/time
            run_date = trigger_config.get("date")  # Should be datetime object or ISO string
            if isinstance(run_date, str):
                run_date = datetime.fromisoformat(run_date)
            trigger = DateTrigger(run_date=run_date)
            
        else:
            return f"Error: Unsupported trigger type: {trigger_type}"
        
        # Add the job
        scheduler.add_job(
            func=workflow_executor,
            trigger=trigger,
            id=workflow_id,
            args=[workflow_id],
            replace_existing=True,
            max_instances=1  # Prevent overlapping executions
        )
        
        next_run = scheduler.get_job(workflow_id).next_run_time
        print(f"✅ Workflow {workflow_id} scheduled. Next run: {next_run}")
        
        return f"Workflow scheduled successfully. Next run: {next_run}"
        
    except Exception as e:
        error_msg = f"Scheduling failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

def unschedule_workflow(workflow_id: str) -> str:
    """Remove a scheduled workflow"""
    try:
        scheduler.remove_job(workflow_id)
        print(f"✅ Workflow {workflow_id} unscheduled successfully")
        return f"Workflow {workflow_id} unscheduled successfully"
    except Exception as e:
        error_msg = f"Unscheduling failed: {str(e)}"
        print(f"❌ {error_msg}")
        return error_msg

def get_scheduled_workflows() -> List[Dict[str, Any]]:
    """Get all scheduled workflows"""
    try:
        jobs = scheduler.get_jobs()
        scheduled_workflows = []
        
        for job in jobs:
            workflow_info = {
                "workflow_id": job.id,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
                "trigger": str(job.trigger),
                "trigger_type": type(job.trigger).__name__,
                "max_instances": job.max_instances,
                "misfire_grace_time": job.misfire_grace_time
            }
            scheduled_workflows.append(workflow_info)
        
        return scheduled_workflows
        
    except Exception as e:
        print(f"❌ Error getting scheduled workflows: {str(e)}")
        return []

def is_workflow_scheduled(workflow_id: str) -> bool:
    """Check if a workflow is currently scheduled"""
    try:
        job = scheduler.get_job(workflow_id)
        return job is not None
    except:
        return False

def get_workflow_schedule_info(workflow_id: str) -> Dict[str, Any]:
    """Get detailed schedule information for a specific workflow"""
    try:
        job = scheduler.get_job(workflow_id)
        
        if not job:
            return {"scheduled": False}
        
        return {
            "scheduled": True,
            "workflow_id": job.id,
            "next_run": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger),
            "trigger_type": type(job.trigger).__name__,
            "max_instances": job.max_instances,
            "misfire_grace_time": job.misfire_grace_time,
            "pending": job.pending
        }
        
    except Exception as e:
        print(f"❌ Error getting workflow schedule info: {str(e)}")
        return {"scheduled": False, "error": str(e)}

# Common cron expressions for easy reference
COMMON_SCHEDULES = {
    "every_minute": "* * * * *",
    "every_5_minutes": "*/5 * * * *",
    "every_hour": "0 * * * *",
    "daily_9am": "0 9 * * *",
    "daily_6pm": "0 18 * * *",
    "weekly_monday_9am": "0 9 * * 1",
    "monthly_1st_9am": "0 9 1 * *",
    "workdays_9am": "0 9 * * 1-5",
    "weekends_10am": "0 10 * * 6,0"
}

def get_common_schedules() -> Dict[str, str]:
    """Get dictionary of common schedule expressions"""
    return COMMON_SCHEDULES

# Cleanup function
def shutdown_scheduler():
    """Shutdown the scheduler"""
    try:
        scheduler.shutdown()
        print("📅 Scheduler shutdown successfully")
    except Exception as e:
        print(f"❌ Error shutting down scheduler: {str(e)}")
