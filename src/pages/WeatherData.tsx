"use client"

import { useState, useEffect } from 'react';

interface WeatherData {
    name: string;
    main: {
        temp: number;
        humidity: number;
        feels_like: number;
    };
    sys: {
        country: string;
    };
    weather: {
        main: string;
        icon: string;
        description: string;
    }[];
    wind: {
        speed: number;
    };
}

interface CitySuggestion {
    name: string;
    country: string;
    state?: string;
}

export default function WeatherData() {
    const [cities, setCities] = useState<string[]>([]);
    const [inputCity, setInputCity] = useState<string>('');
    const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
    const [unit, setUnit] = useState<'C' | 'F'>('C');
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);

    useEffect(() => {
        const savedCities = localStorage.getItem('cities');
        if (savedCities) {
            setCities(JSON.parse(savedCities));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cities', JSON.stringify(cities));
        fetchWeatherData();
    }, [cities]);

    useEffect(() => {
        if (inputCity.trim()) {
            fetchCitySuggestions(inputCity);
        } else {
            setSuggestions([]);
        }
    }, [inputCity]);

    const fetchCitySuggestions = async (query: string) => {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
            );
            if (!response.ok) {
                throw new Error('Failed to fetch city suggestions');
            }
            const data = await response.json();
            setSuggestions(data);
        } catch (err) {
            console.error('Error fetching city suggestions:', err);
        }
    };

    const fetchWeatherData = async () => {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        try {
            const validCities: string[] = [];
            const data = await Promise.all(
                cities.map(async (city) => {
                    try {
                        const response = await fetch(
                            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
                        );
                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error(`API Error for ${city}:`, errorData);
                            throw new Error(`Failed to fetch weather data for ${city}`);
                        }
                        validCities.push(city);
                        return response.json();
                    } catch (err) {
                        console.error(err);
                        return null;
                    }
                })
            );

            const validData = data.filter((item) => item !== null) as WeatherData[];
            setWeatherData(validData);

            if (validCities.length !== cities.length) {
                setCities(validCities);
            }

            setError(null);
        } catch (err) {
            setError('Failed to fetch weather data. Please try again.');
            console.error(err);
        }
    };

    const addCity = async (cityName: string) => {
        if (!cityName) return;

        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`City "${cityName}" not found. Please check the spelling.`);
            }

            if (!cities.includes(cityName)) {
                setCities([...cities, cityName]);
                setInputCity('');
                setError(null);
                setSuggestions([]); // Clear suggestions after adding the city
            }
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        }
    };

    const removeCity = (city: string) => {
        const normalizedCity = city.trim().toLowerCase();
        const updatedCities = cities.filter((c) => c.trim().toLowerCase() !== normalizedCity);

        setCities(updatedCities);

        setWeatherData((prevData) => {
            const updatedData = prevData.filter((data) => data.name.trim().toLowerCase() !== normalizedCity);
            return updatedData;
        });
    };

    const toggleUnit = () => {
        setUnit(unit === 'C' ? 'F' : 'C');
    };

    const convertTemperature = (temp: number) => {
        return unit === 'C' ? temp : (temp * 9) / 5 + 32;
    };

    return (
        <div className="min-h-screen bg-[url('/background.jpg')] bg-cover bg-fixed bg-center">
            <div className="container mx-auto py-28 px-5 lg:px-0 text-white">
                <h1 className="text-6xl font-bold mb-4 text-center">Weather Dashboard</h1>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="mb-4 flex justify-center items-center">
                    <div className='py-8 flex flex-col md:flex-row space-y-4 md:space-y-0 items-center'>
                        <div className="relative w-[100%] md:w-auto lg:w-[500px]">
                            <input
                                type="text"
                                value={inputCity}
                                onChange={(e) => setInputCity(e.target.value)}
                                className="border py-3 px-5 text-xl font-semibold mr-2 w-full rounded-md"
                                placeholder="Enter city name"
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute z-10 mt-2 w-full bg-white text-gray-700 rounded-md shadow-lg">
                                    {suggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="p-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() => {
                                                setInputCity(`${suggestion.name}`);
                                                setSuggestions([]);
                                            }}
                                        >
                                            {suggestion.name}, {suggestion.country} {suggestion.state && `, ${suggestion.state}`}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => addCity(inputCity.split(',')[0].trim())}
                            className="bg-gray-700 text-white py-3 px-5 mx-3 text-xl font-semibold rounded-md"
                        >
                            Add City
                        </button>
                        <button
                            onClick={toggleUnit}
                            className="bg-white text-gray-700 py-3 px-5 text-xl font-semibold rounded-md"
                        >
                            Switch to {unit === 'C' ? 'Fahrenheit' : 'Celsius'}
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {weatherData.map((data) => (
                        <div key={data.name} className="border p-4 rounded-md bg-black opacity-70">
                            <h2 className="text-2xl font-semibold">{data.name}, {data.sys.country}</h2>
                            {data.weather && data.weather[0] ? (
                                <>
                                    <div className='text-center py-7'>
                                        <p className='text-6xl font-thin pb-5'>{convertTemperature(data.main.temp).toFixed(1)}°{unit}</p>
                                        <p className='capitalize text-xl font-semibold'>{data.weather[0].description}</p>
                                    </div>
                                    <div className='flex justify-between items-center'>
                                        <div>
                                            <p className='text-xl'>Feels like: {convertTemperature(data.main.feels_like).toFixed(1)}°{unit}</p>
                                            <p className='text-xl'>Humidity: {data.main.humidity}%</p>
                                            <p className='text-xl'>Wind Speed: {data.wind.speed} m/s</p>
                                        </div>
                                        <div className='flex justify-center items-center'>
                                            <img
                                                src={`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
                                                alt={data.weather[0].main}
                                                className='w-[135px] h-[135px]'
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <p>Weather data not available for this city.</p>
                            )}
                            <button
                                onClick={() => removeCity(data.name)}
                                className="bg-red-400 text-white text-xl p-2 mt-2 w-full cursor-pointer rounded-md"
                            >
                                Remove City
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}