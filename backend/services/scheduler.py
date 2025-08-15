from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from app.core.runner import run_workflow_engine  
scheduler = BackgroundScheduler()
scheduler.start()

def schedule_workflow(workflow_id: str, cron_expression: str):
    # cron_expression example: "0 9 * * *" (every day at 9 AM)
    minute, hour, day, month, day_of_week = cron_expression.split()
    scheduler.add_job(
        run_workflow_engine,
        'cron',
        args=[workflow_id],
        minute=minute,
        hour=hour,
        day=day,
        month=month,
        day_of_week=day_of_week,
        id=workflow_id,
        replace_existing=True
    )

def remove_scheduled_workflow(workflow_id: str):
    scheduler.remove_job(workflow_id)
