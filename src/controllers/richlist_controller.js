const axios = require("axios");

let rich = "old";
let fourThousandRichestAccounts = [];
let numOfAccounts=0;

exports.setVal = async (req, res, next) => {
  try {
    rich = "new";
    res.sendStatus(400);
  } catch {
    res.sendStatus(400);
  }
};

exports.getRichList = async (req, res, next) => {
  try {
    if (fourThousandRichestAccounts.length < 1) {
      res.status(200).json([]);
      return;
    }

    let limit = req.query.limit;
    let offset = req.query.offset;

    if (!limit) limit = 100;
    if (!offset) offset = 0;

    if (limit < 1) {
      res.status(400).json({
        message: "Limit must be positive",
      });
    }
    if (offset < 0) {
      res.status(400).json({
        message: "offset must not be negative",
      });
    }

    if (limit > 100) {
      res.status(400).json({
        message: "Limit cannot be greater than 100",
      });
    } else {
      if (offset > 3999) {
        res.status(400).json({
          message: "Offset cannot be greater than 100",
        });
      }

      end = offset + limit;

      console.log(end, "end");

      const richlistArray = fourThousandRichestAccounts.slice(offset, end);
      res.status(200).json(richlistArray);
    }
  } catch {
    res.sendStatus(400);
  }
};

exports.getVal = async (req, res, next) => {
  try {
    res.status(200).json(rich);
  } catch {
    res.sendStatus(400);
  }
};

exports.getnumOfAccounts = async (req, res, next) => {
  try {
    res.status(200).json({numOfAccounts:numOfAccounts});
  } catch {
    res.sendStatus(400);
  }
};

exports.updateRichlist = async (req, res, next) => {
  try {
    console.log("updating Richlist");
    const LIMIT = 100;

    let after = "-";
    let accountIds;
    let accountDetails;
    let allAccountsDetails = [];
    let count = 0;

    while (after) {
      let accountIdsObj = await axios.get(
        `https://mainnet-1.ndau.tech:3030/account/list?limit=${LIMIT}&after=${after}`
      );

      after = accountIdsObj.data.NextAfter;
      accountIds = accountIdsObj.data.Accounts;

      let accountDetailsObj = await axios.post(
        `https://mainnet-1.ndau.tech:3030/account/accounts`,
        accountIds
      );
      accountDetails = accountDetailsObj.data;
      const accountDetailsEntries = Object.entries(accountDetails);
      allAccountsDetails = [...accountDetailsEntries, ...allAccountsDetails];
      count++;
    }
    console.log(count, "count");
    console.log(allAccountsDetails.length, "allAccountsDetails.length");
    allAccountsDetails.sort((a, b) => b[1].balance - a[1].balance);
    fourThousandRichestAccounts = allAccountsDetails.slice(0, 4000);
    numOfAccounts=allAccountsDetails.length;
  } catch (err) {
    console.log(err, "err");
  }

};
