import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useGeolocation } from "../hooks/useGeolocation";

export const CustomMap = () => {
  const { position } = useGeolocation({ enabled: true });

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
      <button
        className="absolute bottom-4 left-4 z-10 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={() => {
          if (!map.current || !position) return;
          map.current.setCenter([position.lng, position.lat]);
        }}
      >
        Centrar
      </button>

      <div ref={mapContainer} className={`w-full h-full`}></div>
    </div>
  );
};
