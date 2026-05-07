import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "../hooks/useGeolocation";
import { COORDINATES_MOCK } from "../mock/coordinates";

export const CustomMap = () => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const { position, error, isLoading } = useGeolocation({ enabled: isLocationEnabled });

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

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
            coordinates: COORDINATES_MOCK,
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
          "line-color": "#007AFF",
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
    <div className="w-full h-full relative">
      {error && (
        <div className="absolute top-16 left-4 right-4 z-20 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-md text-sm">
          <strong>Aviso:</strong> {error}
        </div>
      )}
      
      {isLoading && !position && (
        <div className="absolute inset-0 z-30 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-700 font-medium px-4 py-2 bg-white rounded shadow-sm">
            Buscando tu ubicación...
          </div>
        </div>
      )}

      {!isLocationEnabled ? (
        <button
          className="absolute top-4 left-4 z-20 bg-green-500 text-white px-6 py-2 rounded shadow-md hover:bg-green-600 transition-colors"
          onClick={() => setIsLocationEnabled(true)}
        >
          Activar mi ubicación
        </button>
      ) : (
        <button
          className="absolute top-4 left-4 z-20 bg-blue-500 text-white px-6 py-2 rounded shadow-md hover:bg-blue-600 transition-colors disabled:opacity-50"
          disabled={!position}
          onClick={() => {
            if (!map.current || !position) return;
            map.current.setCenter([position.lng, position.lat]);
          }}
        >
          Centrar
        </button>
      )}

      <div ref={mapContainer} className={`w-full h-full`}></div>
    </div>
  );
};
