---
description: Integration guide for Slack Notifications.
---

# 💬 Slack Productivity Integration

TaskFlow leverages Slack Incoming Webhooks to deliver real-time productivity coaching and alerts.

### 1. Create a Slack App
1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App** -> **From Scratch**.
3. Name it "TaskFlow" and select your workspace.

### 2. Activate Incoming Webhooks
1. In the Sidebar, go to **Incoming Webhooks**.
2. Toggle to **On**.
3. Click **Add New Webhook to Workspace**.
4. Select the channel where you want notifications.
5. Copy the generated Webhook URL.

### 3. Connect to TaskFlow
1. Navigate to the **Integrations** tab in your TaskFlow dashboard.
2. Click **Add Slack Integration**.
3. Paste the Webhook URL and save.
4. (Advanced) Add `SLACK_WEBHOOK_URL` to your backend `.env` for global system summaries.

---
**Core Features**:
- 🚨 **Reminders**: 1 hour before task due dates.
- ⚠️ **Overdue Alerts**: Real-time pings for missed deadlines.
- 📊 **Nightly Summary**: AI-driven performance synthesis at 21:00.
