import React, { useState } from "react";
import axios from "axios";

function RunForm() {
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/runs", { distance, duration });
      setDistance("");
      setDuration("");
      window.location.reload(); // for enkelhet – laster inn på nytt
    } catch (err) {
      console.error("Error adding run:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Legg til ny økt</h2>
      <input
        type="number"
        placeholder="Distanse (km)"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Varighet (min)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        required
      />
      <button type="submit">Lagre</button>
    </form>
  );
}

export default RunForm;