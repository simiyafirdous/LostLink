import { useState } from "react";

export default function LocationPicker({ locationText = "", coordinates = [0, 0], onChange }) {
  const [address, setAddress] = useState(locationText);
  const [coords, setCoords] = useState(coordinates);
  const [geolocating, setGeolocating] = useState(false);

  const handleAddressChange = (val) => {
    setAddress(val);
    if (onChange) onChange({ locationText: val, coordinates: coords });
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = [pos.coords.longitude, pos.coords.latitude];
        setCoords(newCoords);
        const geoText = address || `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
        setAddress(geoText);
        setGeolocating(false);
        if (onChange) onChange({ locationText: geoText, coordinates: newCoords });
      },
      (err) => {
        setGeolocating(false);
        alert("Failed to retrieve location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="location-picker-container field-group wide">
      <label className="label-text">Incident Location & GPS Coordinates</label>
      <div className="flex-row gap-2">
        <input
          type="text"
          required
          className="flex-1"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="e.g. Student Center 2nd Floor, Main Library Lawn"
        />
        <button
          type="button"
          className="button ghost small shrink-0"
          onClick={handleGeolocate}
          disabled={geolocating}
        >
          {geolocating ? "Locating…" : "📍 Detect GPS"}
        </button>
      </div>
      {Array.isArray(coords) && (coords[0] !== 0 || coords[1] !== 0) && (
        <small className="muted font-xs">
          Coordinates captured: [{coords[0].toFixed(5)}, {coords[1].toFixed(5)}]
        </small>
      )}
    </div>
  );
}
