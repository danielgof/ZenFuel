import { useState } from "react";
import "./App.css";

function App() {
  const [vehicle, setVehicle] = useState("Sedan");
  const [fuelType, setFuelType] = useState("Gasoline");
  const [milesDriven, setMilesDriven] = useState(120);
  const [gallonsUsed, setGallonsUsed] = useState(4);
  const [fuelPrice, setFuelPrice] = useState(3.69);

  const mpg =
    gallonsUsed > 0 ? (milesDriven / gallonsUsed).toFixed(1) : "0";

  const estimatedCost = (gallonsUsed * fuelPrice).toFixed(2);

  return (
    <div className="app">
      {/* HERO */}
      <header className="hero">
        <div>
          <h1>EcoDrive MPG</h1>
          <p>Track fuel efficiency and optimize every mile.</p>
        </div>

        <div className="hero-badge">
          <span>Live Estimate</span>
          <strong>{mpg} MPG</strong>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* Vehicle Card */}
        <section className="card">
          <h2>Vehicle</h2>

          <label>Vehicle Type</label>
          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            <option>Sedan</option>
            <option>SUV</option>
            <option>Truck</option>
            <option>Hybrid</option>
            <option>Electric</option>
          </select>

          <label>Fuel Type</label>
          <select
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          >
            <option>Gasoline</option>
            <option>Diesel</option>
            <option>Premium</option>
            <option>Electric</option>
          </select>
        </section>

        {/* Input Card */}
        <section className="card">
          <h2>Trip Data</h2>

          <label>Miles Driven</label>
          <input
            type="number"
            value={milesDriven}
            onChange={(e) => setMilesDriven(Number(e.target.value))}
          />

          <label>Gallons Used</label>
          <input
            type="number"
            value={gallonsUsed}
            onChange={(e) => setGallonsUsed(Number(e.target.value))}
          />

          <label>Fuel Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={fuelPrice}
            onChange={(e) => setFuelPrice(Number(e.target.value))}
          />
        </section>

        {/* Result Card */}
        <section className="card result-card">
          <h2>Efficiency</h2>

          <div className="metric">
            <span>Estimated MPG</span>
            <strong>{mpg}</strong>
          </div>

          <div className="metric">
            <span>Fuel Cost</span>
            <strong>${estimatedCost}</strong>
          </div>

          <div className="metric">
            <span>Vehicle</span>
            <strong>{vehicle}</strong>
          </div>

          <div className="progress-container">
            <div
              className="progress-bar"
              style={{
                width: `${Math.min(Number(mpg) * 2, 100)}%`,
              }}
            />
          </div>

          <p className="efficiency-text">
            {Number(mpg) >= 35
              ? "Excellent fuel efficiency"
              : Number(mpg) >= 25
              ? "Good efficiency"
              : "Room for improvement"}
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Drive smarter. Save fuel. Reduce emissions.</p>
      </footer>
    </div>
  );
}

export default App;