async function notifyNewSubmission(submission) {
  console.log("New lead notification:");
  console.log({
    submissionId: submission.id,
    widgetId: submission.widget_id,
    name: submission.name,
    email: submission.email
  });

  return true;
}

module.exports = {
  notifyNewSubmission
};