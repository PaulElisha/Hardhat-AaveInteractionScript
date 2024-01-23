const { getNamedAccounts } = require("hardhat");
const { getWeth, amount } = require("../scripts/getWeth");

async function interact() {
  await getWeth();

  const { deployer } = await getNamedAccounts();

  // Lending pool address provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  const lendingpool = await getLendingPool();
  console.log(`Lending pool address ${lendingpool.target}`);

  //deposit

  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // approve

  await approveErc20(wethAddress, lendingpool.target, amount);
  console.log(`Depositing!`);
  await lendingpool.deposit(wethAddress, amount, deployer, 0);
  console.log(`Deposited!`);

  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingpool, deployer);

  // availableBorrowsETH conversion on DAI
  const daiPrice = await getDaiPrice();
  const amountDAIToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber());
  console.log(`You can borrow ${amountDAIToBorrow} DAI`);
  const amountDaiToBorrowWei = ethers.utils.parseEther(amountDAIToBorrow.toString());

  // borrow
  const daiTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  await borrowDai(daiTokenAddress, lendingpool, amountDaiToBorrowWei, deployer);
  await getBorrowUserData(lendingpool, deployer);

  // repay
  await repay(amountDaiToBorrowWei, daiTokenAddress, lendingpool, deployer);
}

async function repay(amount, daiAddress, lendingPool, account) {
  await approveErc20(daiAddress, lendingPool.address, amount, account);
  const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
  await repayTx.wait(1);
  console.log("Repaid!");
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
  const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account);
  await borrowTx.wait(1);
  console.log("You have borrowed!");
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt("AggregatorV3Interface", "0x773616E4d11A78F511299002da57A0a94577F1f4");
  const price = (daiEthPriceFeed.latestRoundData()).answer;
  console.log(`The daiEth price is ${price.toString()}`);
  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account);
  console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
  console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
  console.log(`You can borrow ${availableBorrowsETH} worth of ETH`);
  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool() {
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
  );
  const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress
  );

  return lendingPool;
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend) {
  const erc20Token = await ethers.getContractAt("IERC20", erc20Address);
  const tx = await erc20Token.approve(spenderAddress, amountToSpend);
  await tx.wait(1);
  console.log("Approved!");
}

interact().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
