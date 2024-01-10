const { getNamedAccounts } = require("hardhat");

const amount = ethers.parseEther("0.02");

async function getWeth() {
    const { deployer } = await getNamedAccounts();

    const IWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );

    const tx = await IWeth.deposit({ value: amount })
    await tx.wait(1);
    const wethBalance = await IWeth.balanceOf(deployer);
    console.log(`Got ${wethBalance.toString()} WETH`)
}

getWeth().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

module.exports = { getWeth, amount }