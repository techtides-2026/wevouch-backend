const express = require("express");
const router = express.Router();


const userRouter = require("./route/user_routes");
// const influencerRouter = require("./route/influencer_route");
// const productRouter = require("./route/product_routes");
// const brandRouter = require("./route/brand_routes");
// const bannerRouter = require("./route/banner_routes");
// const categoryRouter = require("./route/category_routes");
// const subCategoryRouter = require("./route/sub_category_routes");
// const subscriptionRouter = require("./route/subscription_routes");
// // const notificationRouter = require("./route/notification_routes");
// // const pushNotificationRouter = require("./route/push_notification_route");
// const onesignalPushNotificationRouter = require("./route/onesignal_push_notification_route");
// const ticketRouter = require("./route/ticket_routes");
// const ticketPackageRouter = require("./route/ticket_package_routes");
// const supportExecutiveRouter = require("./route/support_executive_routes");
// const serviceCenterRouter = require("./route/service_center_routes");
// const modelManagementRouter = require("./route/model_management_routes");
// const ticketLogRouter = require("./route/ticket_log_routes");
// const ticketIssueRouter = require("./route/ticket_issue_routes");
// const ticketIssueCommentRouter = require("./route/ticket_issue_comment_route");
// const serviceExecutiveNotificationRouter = require("./route/service-executive-notification_routes");
// const userTransactionLogRouter = require("./route/user_transaction_log_routes");
// const settingsRoute = require("./route/settings_routes");
// const addressRoute = require("./route/address_routes");
// const userSettingRoute = require("./route/user_settings_routes");
// const versionRoute = require("./route/version_routes");
// // const mailingRoute = require("./route/mailing_routes");
// const whatsappRoute = require("./route/whatsapp");
// const influencerNotificationRoute = require("./route/influencer_notification_route");
// const filterRoute = require("./route/filter_route");
// // const notificationJobRoute = require("./route/notification_job_route");
// const AdminAuthRouter = require("./route/admin_route");


router.use("/user", userRouter);
// router.use("/admin", AdminAuthRouter);
// router.use("/influencer", influencerRouter);
// router.use("/product", productRouter);
// router.use("/brand", brandRouter);
// router.use("/banner", bannerRouter);
// router.use("/category", categoryRouter);
// router.use("/sub-category", subCategoryRouter);
// router.use("/sub", subscriptionRouter);
// router.use("/notification", notificationRouter);
// // router.use("/push-notification", pushNotificationRouter);
// router.use("/onesignal", onesignalPushNotificationRouter);
// router.use("/ticket", ticketRouter);
// router.use("/ticket-package", ticketPackageRouter); /** ticket package router */
// router.use("/support-executive", supportExecutiveRouter);
// router.use("/service-center", serviceCenterRouter);
// router.use("/model-mgmt", modelManagementRouter);
// router.use("/ticket-log", ticketLogRouter);
// router.use("/ticket-issue", ticketIssueRouter);
// router.use("/ticket-issue-comment", ticketIssueCommentRouter);
// router.use("/srvc-exec-notification", serviceExecutiveNotificationRouter);
// router.use("/transaction", userTransactionLogRouter);
// router.use("/setting", settingsRoute);
// router.use("/address", addressRoute);
// router.use("/usersettings", userSettingRoute);
// router.use("/version", versionRoute);
// // router.use("/mail", mailingRoute);
// router.use("/whatsapp", whatsappRoute);
// router.use("/influencer-notification", influencerNotificationRoute);
// router.use("/filter", filterRoute);
// router.use("/notification-job", notificationJobRoute)

module.exports = router;