import { useEffect, useRef, useState } from "react";

type Position = {
  lat: number;
  lng: number;
  accuracy: number;
};

export const useGeolocation = () => {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const watchId = useRef<number | null>(null);
  const prevPosition = useRef<Position | null>(null);

  useEffect(() => {

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        if (prevPosition.current) {
          const latDiff = Math.abs(prevPosition.current.lat - newPos.lat);
          const lngDiff = Math.abs(prevPosition.current.lng - newPos.lng);
          if (latDiff < 0.00005 && lngDiff < 0.00005) {
            return;
          }
        }

        prevPosition.current = newPos;
        setPosition(newPos);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permiso de GPS denegado. Por favor, habilítalo en tu navegador.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Señal de GPS perdida o ubicación no disponible.");
            break;
          case err.TIMEOUT:
            setError("Tiempo de espera agotado al buscar tu ubicación.");
            break;
          default:
            setError("Error desconocido al obtener la ubicación.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    }
  }, [])

  return {
    position,
    error,
    isLoading,
  };
};
