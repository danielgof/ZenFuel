import { useEffect, useState } from "react";

import { Car, Fuel, Settings2, Calendar, Factory } from "lucide-react";

import {
  getYears,
  getMakes,
  getModels,
  getOptions,
  getVehicleDetails,
  type VehicleOption,
  type VehicleDetails,
} from "./services/fuelEconomyApi";
import { MetricCard } from "./components/MetricCard";
import { SelectorCard } from "./components/SelectorCard";
import { InfoCard } from "./components/InfoCard";

declare const chrome: any;

function App() {
  const [years, setYears] = useState<string[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [options, setOptions] = useState<VehicleOption[]>([]);

  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [vehicleData, setVehicleData] = useState<VehicleDetails | null>(null);

  const [loading, setLoading] = useState(false);

  /* ========================================
     LOAD YEARS
  ======================================== */

  useEffect(() => {
    getYears().then(setYears);
  }, []);

  /* ========================================
     LOAD MAKES
  ======================================== */

  useEffect(() => {
    if (!selectedYear) return;

    setSelectedMake("");
    setSelectedModel("");
    setSelectedVehicleId("");
    setVehicleData(null);

    getMakes(selectedYear).then(setMakes);
  }, [selectedYear]);

  /* ========================================
     LOAD MODELS
  ======================================== */

  useEffect(() => {
    if (!selectedYear || !selectedMake) return;

    setSelectedModel("");
    setSelectedVehicleId("");
    setVehicleData(null);

    getModels(selectedYear, selectedMake).then(setModels);
  }, [selectedYear, selectedMake]);

  /* ========================================
     LOAD OPTIONS
  ======================================== */

  useEffect(() => {
    if (!selectedYear || !selectedMake || !selectedModel) return;

    setSelectedVehicleId("");
    setVehicleData(null);

    getOptions(selectedYear, selectedMake, selectedModel).then(setOptions);
  }, [selectedYear, selectedMake, selectedModel]);

  /* ========================================
     LOAD VEHICLE DETAILS
  ======================================== */

  useEffect(() => {
    if (!selectedVehicleId) return;

    setLoading(true);

    getVehicleDetails(selectedVehicleId)
      .then(setVehicleData)
      .finally(() => setLoading(false));
  }, [selectedVehicleId]);

  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      (message: {
        type: string;
        payload: {
          years: string[];
          makes: string[];
          models: string[];
        };
      }) => {
        if (message.type === "VEHICLE_DATA") {
          setYears(message.payload.years);
          setMakes(message.payload.makes);
          setModels(message.payload.models);
        }
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* HERO */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/10 px-4 py-2 rounded-full mb-4 backdrop-blur-xl">
            <Car size={18} />
            <span className="text-sm font-medium">ZenFuel Explorer</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight mb-3">
            Vehicle MPG Lookup
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl">
            Browse official EPA fuel economy data with a modern streamlined
            interface.
          </p>
        </div>

        {/* SELECTORS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {/* YEAR */}
          <SelectorCard icon={<Calendar size={18} />} label="Year">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="select"
            >
              <option value="">Select Year</option>

              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </SelectorCard>

          {/* MAKE */}
          <SelectorCard icon={<Factory size={18} />} label="Make">
            <select
              value={selectedMake}
              disabled={!selectedYear}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="select"
            >
              <option value="">Select Make</option>

              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </SelectorCard>

          {/* MODEL */}
          <SelectorCard icon={<Car size={18} />} label="Model">
            <select
              value={selectedModel}
              disabled={!selectedMake}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="select"
            >
              <option value="">Select Model</option>

              {models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </SelectorCard>

          {/* TRIM */}
          <SelectorCard icon={<Settings2 size={18} />} label="Trim">
            <select
              value={selectedVehicleId}
              disabled={!selectedModel}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="select"
            >
              <option value="">Select Trim</option>

              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </SelectorCard>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="glass-card p-8 text-center animate-pulse">
            Loading vehicle data...
          </div>
        )}

        {/* RESULTS */}
        {vehicleData && !loading && (
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-emerald-500/20 p-3 rounded-2xl">
                <Fuel className="text-emerald-400" size={24} />
              </div>

              <div>
                <h2 className="text-3xl font-bold">Fuel Economy</h2>

                <p className="text-slate-400">EPA estimated efficiency</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <MetricCard label="City MPG" value={vehicleData.cityMpg} />

              <MetricCard label="Highway MPG" value={vehicleData.highwayMpg} />

              <MetricCard
                label="Combined MPG"
                value={vehicleData.combinedMpg}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoCard label="Fuel Type" value={vehicleData.fuelType} />

              <InfoCard label="Transmission" value={vehicleData.transmission} />

              <InfoCard label="Drive" value={vehicleData.drive} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
