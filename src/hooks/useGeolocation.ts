import { useEffect, useRef, useState } from "react";

interface Props {
  enabled: boolean;
}

type Position = {
  lat: number;
  lng: number;
  accuracy: number;
};

export const useGeolocation = ({ enabled }: Props) => {
  const [position, setPosition] = useState<Position | null>(null);

  const [error, setError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);


  useEffect(() => {

    if (!enabled) return

    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Permiso denegado");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Posición no disponible");
            break;
          case err.TIMEOUT:
            setError("Timeout obteniendo ubicación");
            break;
          default:
            setError("Error desconocido");
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
  }, [enabled])



  return {
    position,
    error,
  };
};
