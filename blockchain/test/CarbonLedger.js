
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonLedger", function () {
  async function deployLedger() {
    const [owner, developer, verifier, holderA, holderB] =
      await ethers.getSigners();

    const Ledger = await ethers.getContractFactory("CarbonLedger");
    const ledger = await Ledger.deploy();

    await ledger.waitForDeployment();

    return { ledger, owner, developer, verifier, holderA, holderB };
  }

  async function registerAndVerify(ledger, developer) {
    await ledger.connect(developer).registerProject(
      "Demo Reforestation Project",
      "Maharashtra, India",
      "ipfs://demo-evidence"
    );

    await ledger.reviewProject(1, true);
  }

  it("registers and verifies a project", async function () {
    const { ledger, developer } = await deployLedger();

    await ledger.connect(developer).registerProject(
      "Demo Reforestation Project",
      "Maharashtra, India",
      "ipfs://demo-evidence"
    );

    await ledger.reviewProject(1, true);

    const project = await ledger.projects(1);

    expect(project.name).to.equal("Demo Reforestation Project");
    expect(project.status).to.equal(1); // Verified
    expect(project.developer).to.equal(developer.address);
  });

  it("issues units only after verification", async function () {
    const { ledger, holderA } = await deployLedger();

    await ledger.registerProject(
      "Pending Project",
      "India",
      "ipfs://evidence"
    );

    await expect(
      ledger.issueCredits(1, holderA.address, 1000)
    ).to.be.revertedWith("Project is not verified");

    await ledger.reviewProject(1, true);
    await ledger.issueCredits(1, holderA.address, 1000);

    expect(await ledger.totalIssued()).to.equal(1000);
    expect(await ledger.balances(holderA.address)).to.equal(1000);
  });

  it("allows only the owner to issue units", async function () {
    const { ledger, developer, holderA } = await deployLedger();

    await registerAndVerify(ledger, developer);

    await expect(
      ledger.connect(developer).issueCredits(1, holderA.address, 100)
    ).to.be.revertedWithCustomError(ledger, "OwnableUnauthorizedAccount");
  });

  it("allows an authorized verifier to approve a project", async function () {
    const { ledger, developer, verifier } = await deployLedger();

    await ledger.setVerifier(verifier.address, true);

    await ledger.connect(developer).registerProject(
      "Solar Project",
      "Rajasthan, India",
      "ipfs://solar-evidence"
    );

    await ledger.connect(verifier).reviewProject(1, true);

    expect((await ledger.projects(1)).status).to.equal(1);
  });

  it("transfers units without changing total issuance", async function () {
    const { ledger, developer, holderA, holderB } =
      await deployLedger();

    await registerAndVerify(ledger, developer);
    await ledger.issueCredits(1, holderA.address, 1000);
    await ledger.connect(holderA).transferCredits(holderB.address, 200);

    expect(await ledger.balances(holderA.address)).to.equal(800);
    expect(await ledger.balances(holderB.address)).to.equal(200);
    expect(await ledger.totalIssued()).to.equal(1000);
    expect(await ledger.outstandingUnits()).to.equal(1000);
  });

  it("retires units and prevents their reuse", async function () {
    const { ledger, developer, holderA, holderB } =
      await deployLedger();

    await registerAndVerify(ledger, developer);
    await ledger.issueCredits(1, holderA.address, 1000);
    await ledger.connect(holderA).transferCredits(holderB.address, 200);
    await ledger.connect(holderA).retireCredits(100);

    expect(await ledger.balances(holderA.address)).to.equal(700);
    expect(await ledger.balances(holderB.address)).to.equal(200);
    expect(await ledger.totalIssued()).to.equal(1000);
    expect(await ledger.totalRetired()).to.equal(100);
    expect(await ledger.outstandingUnits()).to.equal(900);

    await expect(
      ledger.connect(holderA).transferCredits(holderB.address, 701)
    ).to.be.revertedWith("Insufficient balance");
  });

  it("rejects zero-value issuance and retirement", async function () {
    const { ledger, developer, holderA } = await deployLedger();

    await registerAndVerify(ledger, developer);

    await expect(
      ledger.issueCredits(1, holderA.address, 0)
    ).to.be.revertedWith("Amount must be positive");

    await ledger.issueCredits(1, holderA.address, 100);

    await expect(
      ledger.connect(holderA).retireCredits(0)
    ).to.be.revertedWith("Amount must be positive");
  });
});
