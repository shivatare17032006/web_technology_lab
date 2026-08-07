<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Electricity Bill Calculator</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="shell">
        <section class="hero card">
            <div>
                <p class="eyebrow">Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)</p>
                <h1>Domestic Billing Calculator</h1>
                <p class="lead">Submit your monthly meter readings to compute consumption charges, energy duty, and view a formal printable invoice.</p>
            </div>
            <div class="rate-box">
                <h2>Tariff</h2>
                <ul>
                    <li>First 50 units - Rs. 3.50/unit</li>
                    <li>Next 100 units - Rs. 4.00/unit</li>
                    <li>Next 100 units - Rs. 5.20/unit</li>
                    <li>Above 250 units - Rs. 6.50/unit</li>
                </ul>
            </div>
        </section>

        <section class="card form-card">
            <h2>Consumer & Usage Details</h2>
            <form action="bill.php" method="post" class="bill-form">
                <label for="customer_name">Customer Full Name</label>
                <input type="text" id="customer_name" name="customer_name" required placeholder="Enter full name">

                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="Enter email address">

                <label for="phone">Phone Number</label>
                <input type="tel" id="phone" name="phone" required pattern="[0-9]{10}" placeholder="Enter 10-digit mobile number">

                <label for="units">Units Consumed (kWh)</label>
                <input type="number" id="units" name="units" min="0" step="1" required placeholder="Enter meter units consumed">

                <button type="submit" class="btn btn-primary">Generate Bill</button>
            </form>
        </section>
    </main>
</body>
</html>