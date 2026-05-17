import { useEffect, useState } from "react";

import {
  getYears,
  getMakes,
  getModels,
  getOptions,
  getVehicleDetails,
} from "./services/fuelEconomyApi";

function App() {
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [options, setOptions] = useState<any[]>([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [vehicleData, setVehicleData] = useState<any>(null);

  // Load years
  useEffect(() => {
    getYears().then(setYears);
  }, []);

  // Load makes
  useEffect(() => {
    if (selectedYear) {
      getMakes(selectedYear).then(setMakes);
    }
  }, [selectedYear]);

  // Load models
  useEffect(() => {
    if (selectedYear && selectedMake) {
      getModels(selectedYear, selectedMake).then(setModels);
    }
  }, [selectedYear, selectedMake]);

  // Load options
  useEffect(() => {
    if (selectedYear && selectedMake && selectedModel) {
      getOptions(
        selectedYear,
        selectedMake,
        selectedModel
      ).then(setOptions);
    }
  }, [selectedYear, selectedMake, selectedModel]);

  // Load MPG data
  useEffect(() => {
    if (selectedVehicleId) {
      getVehicleDetails(selectedVehicleId).then(
        setVehicleData
      );
    }
  }, [selectedVehicleId]);

  return (
    <div className="app">
      <h1>ZenFuel MPG Explorer</h1>

      <select
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        <option>Select Year</option>

        {years.map((year) => (
          <option key={year}>{year}</option>
        ))}
      </select>

      <select
        onChange={(e) => setSelectedMake(e.target.value)}
      >
        <option>Select Make</option>

        {makes.map((make) => (
          <option key={make}>{make}</option>
        ))}
      </select>

      <select
        onChange={(e) => setSelectedModel(e.target.value)}
      >
        <option>Select Model</option>

        {models.map((model) => (
          <option key={model}>{model}</option>
        ))}
      </select>

      <select
        onChange={(e) =>
          setSelectedVehicleId(e.target.value)
        }
      >
        <option>Select Trim</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.text}
          </option>
        ))}
      </select>

      {vehicleData && (
        <div className="results-card">
          <h2>Fuel Economy</h2>

          <p>City MPG: {vehicleData.cityMpg}</p>

          <p>Highway MPG: {vehicleData.highwayMpg}</p>

          <p>Combined MPG: {vehicleData.combinedMpg}</p>

          <p>Fuel Type: {vehicleData.fuelType}</p>
        </div>
      )}
    </div>
  );
}

export default App;