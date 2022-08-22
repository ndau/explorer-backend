var cron = require("node-cron");
const { updateRichlist } = require("./richlist_controller");

// export default initalizeRichlist;

const initalizeRichlist = () => {
  console.log("initalizing Richlist");
  updateRichlist();
  job.start();
};

const job = cron.schedule("0 */1 * * *", () => {
  console.log("Running Cron");
  updateRichlist();
});

initalizeRichlist();
