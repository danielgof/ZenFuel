import { useEffect, useState, useRef } from 'react';

import { Car, Fuel, Settings2, Calendar, Factory } from 'lucide-react';

import {
    getYears,
    getMakes,
    getModels,
    getOptions,
    getVehicleDetails,
    type VehicleOption,
    type VehicleDetails,
} from './services/fuelEconomyApi';

import { MetricCard } from './components/MetricCard';
import { SelectorCard } from './components/SelectorCard';
import { InfoCard } from './components/InfoCard';

// declare const chrome: any;

/* ========================================
   VEHICLE TITLE PARSER
======================================== */

const MAKES = [
    'Acura',
    'Audi',
    'BMW',
    'Buick',
    'Cadillac',
    'Chevrolet',
    'Chrysler',
    'Dodge',
    'Ford',
    'GMC',
    'Honda',
    'Hyundai',
    'Infiniti',
    'Jeep',
    'Kia',
    'Lexus',
    'Mazda',
    'Mercedes',
    'Nissan',
    'Subaru',
    'Tesla',
    'Toyota',
    'Volkswagen',
    'Volvo',
];

function parseVehicleTitle(title: string) {
    const cleaned = title.replace(/\|.*$/, '').replace(/[-–—]/g, ' ').trim();

    const words = cleaned.split(/\s+/);

    let year = '';
    let make = '';
    let model = '';

    // YEAR
    const yearMatch = cleaned.match(/\b(19|20)\d{2}\b/);

    if (yearMatch) {
        year = yearMatch[0];
    }

    // MAKE
    for (const word of words) {
        const found = MAKES.find((m) => m.toLowerCase() === word.toLowerCase());

        if (found) {
            make = found;
            break;
        }
    }

    // MODEL
    if (make) {
        const makeIndex = words.findIndex(
            (w) => w.toLowerCase() === make.toLowerCase()
        );

        const stopWords = [
            'SUV',
            'Sedan',
            'Truck',
            'Crossover',
            'Hybrid',
            'Coupe',
            'EV',
            'Electric',
            'Vehicle',
            'Cars',
        ];

        const modelWords: string[] = [];

        for (let i = makeIndex + 1; i < words.length; i++) {
            const word = words[i];

            if (stopWords.some((s) => s.toLowerCase() === word.toLowerCase())) {
                break;
            }

            modelWords.push(word);
        }

        model = modelWords.join(' ');
    }

    return {
        year,
        make,
        model,
    };
}

function App() {
    const [years, setYears] = useState<string[]>([]);
    const [makes, setMakes] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [options, setOptions] = useState<VehicleOption[]>([]);

    const [selectors, setSelectors] = useState({
        year: '',
        make: '',
        model: '',
        vehicleId: '',
    });

    const [vehicleData, setVehicleData] = useState<VehicleDetails | null>(null);

    const [loading, setLoading] = useState(false);

    // DETECTED VEHICLE FROM PAGE TITLE
    const [detectedVehicle, setDetectedVehicle] = useState({
        year: '',
        make: '',
        model: '',
    });

    // Track what we've already auto-matched to avoid redundant updates
    const matchedMakeRef = useRef('');
    const matchedModelRef = useRef('');

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
        if (!selectors.year) return;
        getMakes(selectors.year).then(setMakes);
    }, [selectors.year]);

    /* ========================================
     LOAD MODELS
  	======================================== */

    useEffect(() => {
        if (!selectors.year || !selectors.make) return;
        getModels(selectors.year, selectors.make).then(setModels);
    }, [selectors.year, selectors.make]);

    /* ========================================
     LOAD OPTIONS
  	======================================== */

    useEffect(() => {
        if (!selectors.year || !selectors.make || !selectors.model) return;
        getOptions(selectors.year, selectors.make, selectors.model).then(setOptions);
    }, [selectors.year, selectors.make, selectors.model]);

    /* ========================================
     AUTO-DETECT VEHICLE FROM ACTIVE TAB
  	======================================== */

    useEffect(() => {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            (tabs: chrome.tabs.Tab[]) => {
                const activeTab = tabs[0];

                if (!activeTab?.id) return;

                if (
                    activeTab.url?.startsWith('chrome://') ||
                    activeTab.url?.startsWith('edge://')
                ) {
                    console.log(
                        'Cannot run extensions on browser internal pages.'
                    );
                    return;
                }

                chrome.scripting.executeScript(
                    {
                        target: { tabId: activeTab.id },
                        files: ['content.js'],
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.error(
                                'Injection failed:',
                                chrome.runtime.lastError.message
                            );
                            return;
                        }

						interface ScrapeResponse {
							title: string;
							url: string;
							success: boolean;
							data?: string[];
						}

                        chrome.tabs.sendMessage(
                            activeTab.id!,
                            { action: 'SCRAPE_VEHICLE_DROPDOWNS' },
                            (response: ScrapeResponse) => {
                                if (chrome.runtime.lastError) {
                                    console.log(
                                        'Message failed:',
                                        chrome.runtime.lastError.message
                                    );
                                    return;
                                }

                                if (!response) return;

                                console.log('PAGE TITLE:', response.title);
                                console.log('PAGE URL:', response.url);

                                const parsed = parseVehicleTitle(
                                    response.title
                                );

                                console.log('PARSED VEHICLE:', parsed);

                                setDetectedVehicle(parsed);

                                // AUTO-SELECT YEAR
                                if (parsed.year) {
                                    setSelectors((prev) => ({
                                        ...prev,
                                        year: parsed.year,
                                    }));
                                }
                            }
                        );
                    }
                );
            }
        );
    }, []);

    /* ========================================
     AUTO-MATCH MAKE
  ======================================== */

    useEffect(() => {
        if (!detectedVehicle.make) return;
        if (makes.length === 0) return;

        const matchedMake = makes.find(
            (m) => m.toLowerCase() === detectedVehicle.make.toLowerCase()
        );

        if (matchedMake && matchedMake !== matchedMakeRef.current) {
            console.log('MATCHED MAKE:', matchedMake);
            matchedMakeRef.current = matchedMake;

            setSelectors((prev) => ({
                ...prev,
                make: matchedMake,
            }));
        }
    }, [makes, detectedVehicle]);

    /* ========================================
     AUTO-MATCH MODEL
  ======================================== */

    useEffect(() => {
        if (!detectedVehicle.model) return;
        if (models.length === 0) return;

        const normalizedDetected = detectedVehicle.model
            .toLowerCase()
            .replace(/\s+/g, '');

        const matchedModel = models.find((m) => {
            const normalizedModel = m.toLowerCase().replace(/\s+/g, '');

            return (
                normalizedModel.includes(normalizedDetected) ||
                normalizedDetected.includes(normalizedModel)
            );
        });

        if (matchedModel && matchedModel !== matchedModelRef.current) {
            console.log('MATCHED MODEL:', matchedModel);
            matchedModelRef.current = matchedModel;

            setSelectors((prev) => ({
                ...prev,
                model: matchedModel,
            }));
        }
    }, [models, detectedVehicle]);

    /* ========================================
     LOAD VEHICLE DETAILS
  	======================================== */

    useEffect(() => {
        if (!selectors.vehicleId) return;

        let cancelled = false;

        (async () => {
            if (cancelled) return;
            setLoading(true);

            try {
                const data = await getVehicleDetails(selectors.vehicleId);
                if (!cancelled) {
                    setVehicleData(data);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectors.vehicleId]);

    return (
        <div
            className="
      min-h-screen
      bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%),linear-gradient(to_bottom_right,#020617,#000814,#020617)]
      text-white
      p-5
    "
        >
            <div className="max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="mb-6">
                    <div
                        className="
            inline-flex
            items-center
            gap-3
            px-5
            py-3
            rounded-full
            bg-white/[0.05]
            border
            border-white/10
            backdrop-blur-2xl
            shadow-lg
          "
                    >
                        <div
                            className="
              w-8
              h-8
              rounded-full
              bg-emerald-500/15
              flex
              items-center
              justify-center
            "
                        >
                            <Car size={16} className="text-emerald-300" />
                        </div>

                        <div>
                            <div className="text-sm font-semibold tracking-wide">
                                ZenFuel Explorer
                            </div>

                            <div className="text-[11px] text-slate-400">
                                Smart vehicle fuel lookup
                            </div>
                        </div>
                    </div>

                    {/* AUTO DETECT STATUS */}
                    {detectedVehicle.make && (
                        <div className="mt-4 text-sm text-emerald-300/80 px-1">
                            Detected{' '}
                            <span className="font-medium text-white">
                                {detectedVehicle.year} {detectedVehicle.make}{' '}
                                {detectedVehicle.model}
                            </span>
                        </div>
                    )}
                </div>

                {/* SELECTORS CONTAINER */}
                <div
                    className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-white/10
          bg-white/[0.03]
          backdrop-blur-2xl
          shadow-[0_0_50px_rgba(0,0,0,0.45)]
          p-4
        "
                >
                    {/* subtle glow */}
                    <div
                        className="
            absolute
            inset-0
            bg-gradient-to-br
            from-blue-500/[0.04]
            via-transparent
            to-emerald-500/[0.03]
            pointer-events-none
          "
                    />

                    <div className="relative flex gap-4 overflow-x-auto scrollbar-none">
                        {/* YEAR */}
                        <SelectorCard
                            icon={<Calendar size={16} />}
                            label="Year"
                            className="min-w-[180px] flex-1"
                        >
                            <select
                                value={selectors.year}
                                onChange={(e) => {
                                    setSelectors({
                                        year: e.target.value,
                                        make: '',
                                        model: '',
                                        vehicleId: '',
                                    });
                                    setVehicleData(null);
                                }}
                                className="
        w-full
        h-12
        rounded-2xl
        border
        border-white/10
        bg-black/20
        px-4
        text-sm
        text-white
        outline-none
        transition-all
        duration-200
        hover:border-white/20
        focus:border-emerald-400/40
        focus:bg-white/[0.04]
      "
                            >
                                <option value="">Select</option>

                                {years.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </SelectorCard>

                        {/* MAKE */}
                        <SelectorCard
                            icon={<Factory size={16} />}
                            label="Make"
                            className="min-w-[180px] flex-1"
                        >
                            <select
                                value={selectors.make}
                                disabled={!selectors.year}
                                onChange={(e) => {
                                    setSelectors((prev) => ({
                                        ...prev,
                                        make: e.target.value,
                                        model: '',
                                        vehicleId: '',
                                    }));
                                    setVehicleData(null);
                                }}
                                className="
        w-full
        h-12
        rounded-2xl
        border
        border-white/10
        bg-black/20
        px-4
        text-sm
        text-white
        outline-none
        transition-all
        duration-200
        hover:border-white/20
        focus:border-emerald-400/40
        focus:bg-white/[0.04]
        disabled:opacity-50
      "
                            >
                                <option value="">Select</option>

                                {makes.map((make) => (
                                    <option key={make} value={make}>
                                        {make}
                                    </option>
                                ))}
                            </select>
                        </SelectorCard>

                        {/* MODEL */}
                        <SelectorCard
                            icon={<Car size={16} />}
                            label="Model"
                            className="min-w-[180px] flex-1"
                        >
                            <select
                                value={selectors.model}
                                disabled={!selectors.make}
                                onChange={(e) => {
                                    setSelectors((prev) => ({
                                        ...prev,
                                        model: e.target.value,
                                        vehicleId: '',
                                    }));
                                    setVehicleData(null);
                                }}
                                className="
        w-full
        h-12
        rounded-2xl
        border
        border-white/10
        bg-black/20
        px-4
        text-sm
        text-white
        outline-none
        transition-all
        duration-200
        hover:border-white/20
        focus:border-emerald-400/40
        focus:bg-white/[0.04]
        disabled:opacity-50
      "
                            >
                                <option value="">Select</option>

                                {models.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        </SelectorCard>

                        {/* TRIM */}
                        <SelectorCard
                            icon={<Settings2 size={16} />}
                            label="Trim"
                            className="min-w-[180px] flex-1"
                        >
                            <select
                                value={selectors.vehicleId}
                                disabled={!selectors.model}
                                onChange={(e) =>
                                    setSelectors((prev) => ({
                                        ...prev,
                                        vehicleId: e.target.value,
                                    }))
                                }
                                className="
        w-full
        h-12
        rounded-2xl
        border
        border-white/10
        bg-black/20
        px-4
        text-sm
        text-white
        outline-none
        transition-all
        duration-200
        hover:border-white/20
        focus:border-emerald-400/40
        focus:bg-white/[0.04]
        disabled:opacity-50
      "
                            >
                                <option value="">Select</option>

                                {options.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.text}
                                    </option>
                                ))}
                            </select>
                        </SelectorCard>
                    </div>
                </div>

                {/* LOADING */}
                {loading && (
                    <div
                        className="
            mt-6
            rounded-3xl
            border
            border-white/10
            bg-white/[0.03]
            backdrop-blur-2xl
            p-8
            text-center
            text-slate-300
            animate-pulse
          "
                    >
                        Loading vehicle data...
                    </div>
                )}

                {/* RESULTS */}
                {vehicleData && !loading && (
                    <div
                        className="
            mt-6
            rounded-[32px]
            border
            border-white/10
            bg-white/[0.03]
            backdrop-blur-2xl
            p-6
            shadow-[0_0_50px_rgba(0,0,0,0.35)]
          "
                    >
                        {/* HEADER */}
                        <div className="flex items-center gap-4 mb-8">
                            <div
                                className="
                w-14
                h-14
                rounded-2xl
                bg-emerald-500/10
                border
                border-emerald-500/20
                flex
                items-center
                justify-center
              "
                            >
                                <Fuel className="text-emerald-300" size={24} />
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Fuel Economy
                                </h2>

                                <p className="text-sm text-slate-400">
                                    EPA estimated efficiency
                                </p>
                            </div>
                        </div>

                        {/* METRICS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                            <MetricCard
                                label="City MPG"
                                value={vehicleData.cityMpg}
                            />

                            <MetricCard
                                label="Highway MPG"
                                value={vehicleData.highwayMpg}
                            />

                            <MetricCard
                                label="Combined MPG"
                                value={vehicleData.combinedMpg}
                            />
                        </div>

                        {/* INFO */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <InfoCard
                                label="Fuel Type"
                                value={vehicleData.fuelType}
                            />

                            <InfoCard
                                label="Transmission"
                                value={vehicleData.transmission}
                            />

                            <InfoCard label="Drive" value={vehicleData.drive} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
