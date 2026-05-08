import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "../hooks/useGeolocation";
import { ROUTES_MOCK } from "../mock/coordinates";

export const CustomMap = () => {
  const { position, error, isLoading } = useGeolocation();
  const [sidebar, setSidebar] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<number>(0);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebar((prev) => !prev);
  }, []);

  const handleSelectRoute = useCallback((index: number) => {
    setSelectedRoute(index);
    if (!map.current) return;
    const source = map.current.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: ROUTES_MOCK[index].coordinates,
        },
      });
      map.current.setPaintProperty(
        "route",
        "line-color",
        ROUTES_MOCK[index].color,
      );
    }
    setSidebar(false);
  }, []);

  const handleCenterMap = useCallback(() => {
    if (!map.current || !position) return;
    map.current.setCenter([position.lng, position.lat]);
  }, [position]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const apiKey = import.meta.env.VITE_AWS_MAP_API_KEY;
    const region = import.meta.env.VITE_AWS_REGION;
    const style = "Standard";
    const colorScheme = "Light";

    const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [-77.072, -12.093],
      zoom: 13,
    });
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    markerRef.current = new maplibregl.Marker({
      color: "#007AFF",
    })
      .setLngLat([-77.072, -12.093])
      .addTo(map.current!);

    map.current.on("load", () => {
      if (!map.current) return;
      map.current.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: ROUTES_MOCK[0].coordinates,
          },
        },
      });
      map.current.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": ROUTES_MOCK[0].color,
          "line-width": 5,
        },
      });
    });

    return () => {
      if (map.current) {
        markerRef.current?.remove();
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !position || !markerRef.current) return;

    markerRef.current.setLngLat([position.lng, position.lat]);
  }, [position]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-50">
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex items-center justify-between transition-all duration-300">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Menu Button */}
      <button
        className="absolute z-20 left-4 top-4 bg-white/90 backdrop-blur-sm text-gray-700 p-3 rounded-xl shadow-lg border border-gray-100 hover:bg-white transition-all active:scale-95"
        onClick={toggleSidebar}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Drawer */}
      <div 
        className={`absolute z-30 left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform ${
          sidebar ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Rutas</h2>
            <p className="text-sm text-gray-500 mt-1">Selecciona tu destino</p>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-3">
            {ROUTES_MOCK.map((route, index) => (
              <li
                key={index}
                className={`p-4 rounded-xl transition-all cursor-pointer border ${
                  selectedRoute === index 
                    ? "bg-blue-50 border-blue-200 shadow-sm" 
                    : "bg-white border-gray-100 hover:border-blue-100 hover:bg-gray-50 hover:shadow-sm"
                }`}
                onClick={() => handleSelectRoute(index)}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${selectedRoute === index ? "text-blue-700" : "text-gray-700"}`}>
                    {route.label}
                  </span>
                  {selectedRoute === index && (
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Backdrop for sidebar */}
      {sidebar && (
        <div 
          className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-20 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {isLoading && !position && (
        <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-gray-700 font-medium text-lg">Buscando tu ubicación...</div>
          </div>
        </div>
      )}

      {/* Center Map Button */}
      <button
        className={`absolute bottom-8 right-6 z-20 bg-white text-gray-700 p-4 rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 group ${
          !position ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
        disabled={!position}
        onClick={handleCenterMap}
        aria-label="Centrar en mi ubicación"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2" />
        </svg>
      </button>

      <div ref={mapContainer} className={`w-full h-full`}></div>
    </div>
  );
};
