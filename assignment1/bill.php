<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MSEDCL - Official Electricity Bill</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="shell print-container">
        <!-- Print / Navigation Control Panel (Hidden on Print) -->
        <div class="control-panel no-print">
            <a class="btn btn-secondary" href="index.php">← Back to Calculator</a>
            <button class="btn btn-primary" onclick="window.print()">Print Official Bill</button>
        </div>

        <?php
        // Validate Inputs
        $customerName = isset($_POST['customer_name']) ? trim($_POST['customer_name']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
        $units = isset($_POST['units']) ? (float) $_POST['units'] : null;

        $errors = [];
        if (empty($customerName)) {
            $errors[] = "Customer Name is required.";
        }
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = "A valid Email Address is required.";
        }
        if (empty($phone) || !preg_match('/^[0-9]{10}$/', $phone)) {
            $errors[] = "A valid 10-digit Phone Number is required.";
        }
        if ($units === null || $units < 0) {
            $errors[] = "Units Consumed must be a positive number.";
        }

        if (!empty($errors)) {
            echo '<section class="card error-card">';
            echo '<h2>Validation Error</h2>';
            echo '<ul>';
            foreach ($errors as $error) {
                echo '<li class="error">' . htmlspecialchars($error) . '</li>';
            }
            echo '</ul>';
            echo '<a class="btn btn-secondary" href="index.php">Go Back</a>';
            echo '</section>';
            echo '</body></html>';
            exit;
        }

        // Calculations
        $remaining = $units;
        $energyCharges = 0.0;
        $breakdown = [];

        // Slab 1: First 50 units @ Rs. 3.50
        $slab1Units = min($remaining, 50);
        $slab1Amount = $slab1Units * 3.50;
        $energyCharges += $slab1Amount;
        $remaining -= $slab1Units;
        $breakdown[] = ['label' => '0 - 50 Units', 'units' => $slab1Units, 'rate' => 3.50, 'amount' => $slab1Amount];

        // Slab 2: Next 100 units (51-150) @ Rs. 4.00
        $slab2Units = min(max($remaining, 0), 100);
        $slab2Amount = $slab2Units * 4.00;
        $energyCharges += $slab2Amount;
        $remaining -= $slab2Units;
        $breakdown[] = ['label' => '51 - 150 Units', 'units' => $slab2Units, 'rate' => 4.00, 'amount' => $slab2Amount];

        // Slab 3: Next 100 units (151-250) @ Rs. 5.20
        $slab3Units = min(max($remaining, 0), 100);
        $slab3Amount = $slab3Units * 5.20;
        $energyCharges += $slab3Amount;
        $remaining -= $slab3Units;
        $breakdown[] = ['label' => '151 - 250 Units', 'units' => $slab3Units, 'rate' => 5.20, 'amount' => $slab3Amount];

        // Slab 4: Above 250 units @ Rs. 6.50
        $slab4Units = max($remaining, 0);
        $slab4Amount = $slab4Units * 6.50;
        $energyCharges += $slab4Amount;
        $breakdown[] = ['label' => 'Above 250 Units', 'units' => $slab4Units, 'rate' => 6.50, 'amount' => $slab4Amount];

        // Net Amount (Strictly energy charges only, no extra fees/taxes)
        $netPayable = $energyCharges;

        // Mock invoice fields
        $billNo = "MSEDCL/" . date('Y') . "/" . mt_rand(100000, 999999);
        $consumerNo = "12-" . mt_rand(1000, 9999) . "-" . mt_rand(1000, 9999) . "-8";
        $billDate = date('d M Y');
        $dueDate = date('d M Y', strtotime('+15 days'));
        $billingPeriod = date('01 M Y') . " to " . date('t M Y');
        ?>

        <!-- Official Utility Invoice Container -->
        <article class="gov-bill">
            <!-- Header Banner -->
            <header class="bill-header">
                <div class="gov-crest">
                    <span class="crest-symbol">🏛️</span>
                </div>
                <div class="gov-title">
                    <h1>MAHARASHTRA STATE ELECTRICITY DISTRIBUTION CO. LTD.</h1>
                    <p class="sub-title">A Government of Maharashtra Undertaking (MSEDCL)</p>
                    <p class="office-address">Registered Office: Prakashgad, Plot No. G-9, Bandra (East), Mumbai - 400051</p>
                </div>
            </header>

            <div class="bill-title-strip">
                <h2>OFFICIAL ELECTRICITY STATEMENT (DOMESTIC TARIFF)</h2>
            </div>

            <!-- Meta details layout -->
            <div class="invoice-meta-grid">
                <div class="meta-section">
                    <h3>Consumer Profile</h3>
                    <table>
                        <tr>
                            <th>Consumer Name:</th>
                            <td><strong><?php echo htmlspecialchars($customerName); ?></strong></td>
                        </tr>
                        <tr>
                            <th>Email Address:</th>
                            <td><?php echo htmlspecialchars($email); ?></td>
                        </tr>
                        <tr>
                            <th>Mobile Number:</th>
                            <td><?php echo htmlspecialchars($phone); ?></td>
                        </tr>
                        <tr>
                            <th>Connection Type:</th>
                            <td>LT-Domestic (Single Phase)</td>
                        </tr>
                    </table>
                </div>

                <div class="meta-section">
                    <h3>Billing Information</h3>
                    <table>
                        <tr>
                            <th>Consumer No:</th>
                            <td><strong><?php echo htmlspecialchars($consumerNo); ?></strong></td>
                        </tr>
                        <tr>
                            <th>Bill Number:</th>
                            <td><?php echo htmlspecialchars($billNo); ?></td>
                        </tr>
                        <tr>
                            <th>Bill Date:</th>
                            <td><?php echo htmlspecialchars($billDate); ?></td>
                        </tr>
                        <tr>
                            <th>Due Date:</th>
                            <td><strong class="text-danger"><?php echo htmlspecialchars($dueDate); ?></strong></td>
                        </tr>
                        <tr>
                            <th>Billing Cycle:</th>
                            <td><?php echo htmlspecialchars($billingPeriod); ?></td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Meter Reading Details -->
            <div class="meter-info-section">
                <h3>Meter Reading & Consumption Details</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Meter Number</th>
                            <th>Previous Reading</th>
                            <th>Current Reading</th>
                            <th>Multiplying Factor</th>
                            <th>Consumption (kWh / Units)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>MTR-MSEDCL-<?php echo mt_rand(4000, 9999); ?></td>
                            <td><?php echo number_format(max(0, 1500 - $units), 0); ?></td>
                            <td><?php echo number_format(1500, 0); ?></td>
                            <td>1.0</td>
                            <td><strong><?php echo number_format($units, 0); ?></strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Energy Calculation & Breakdown -->
            <div class="calculation-section">
                <h3>Slab-wise Energy Charges Calculation</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Slab Range / Tier</th>
                            <th>Units Consumed (kWh)</th>
                            <th>Rate per Unit (Rs.)</th>
                            <th>Energy Charge Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($breakdown as $slab): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($slab['label']); ?></td>
                                <td><?php echo number_format($slab['units'], 0); ?></td>
                                <td>Rs. <?php echo number_format($slab['rate'], 2); ?></td>
                                <td>Rs. <?php echo number_format($slab['amount'], 2); ?></td>
                            </tr>
                        <?php endforeach; ?>
                        <tr class="highlight-row">
                            <td colspan="3" class="text-right">Total Net Energy Charges:</td>
                            <td><strong>Rs. <?php echo number_format($energyCharges, 2); ?></strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Taxes, Duties, and Grand Total -->
            <div class="tax-summary-grid">
                <div class="disclaimer-box">
                    <h4>Important Terms & Conditions</h4>
                    <ul>
                        <li>Please pay your bill on or before the due date to avoid a late charge surcharge of 1.5% on the gross bill.</li>
                        <li>Payments can be made via authorized online gateways, UPI, or designated collection centers.</li>
                        <li>This is an officially certified electricity bill issued by MSEDCL.</li>
                        <li>For any billing disputes or meter complaints, please contact customercare@mahadiscom.in.</li>
                    </ul>
                </div>
                <div class="totals-box">
                    <table>
                        <tr>
                            <th>Total Energy Charges:</th>
                            <td>Rs. <?php echo number_format($energyCharges, 2); ?></td>
                        </tr>
                        <tr class="grand-total-row">
                            <th>NET PAYABLE AMOUNT:</th>
                            <td><strong>Rs. <?php echo number_format($netPayable, 2); ?></strong></td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Footer Details -->
            <footer class="bill-footer">
                <div class="watermark-sign">
                    <p class="certified-stamp">OFFICIALLY VERIFIED</p>
                    <p class="sign-desc">Maharashtra State Electricity Distribution Co. Ltd.</p>
                </div>
                <div class="support-contacts">
                    <p>Toll-Free Helpline: <strong>1800-212-3435 / 1800-233-3435</strong></p>
                    <p>Website: www.mahadiscom.in | Support: customercare@mahadiscom.in</p>
                </div>
            </footer>
        </article>
    </main>
</body>
</html>