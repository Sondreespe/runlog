import React, { useEffect, useState } from "react";
import axios from "axios";

function RunList() {
  const [runs, setRuns] = useState([]);// empty array to hold runs

  useEffect(() => {
    axios.get("api/runs") // fetches runs from the API
      .then(res => setRuns(res.data))
      .catch(err => console.error("Error fetching runs:", err));
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/runs/${id}`);
      setRuns(runs.filter(run => run._id !== id));
    } catch (err) {
      console.error("Feil ved sletting:", err);
    }
  }
  return (
    <div>
      <h2>Treningshistorikk</h2>
      {runs.length === 0 ? (
        <p>Ingen økter ennå.</p>
      ) : (
        <ul>
          {runs.map((run) => (
            <li key={run._id}>
              {run.distance} km på {run.duration} min - {new Date(run.date).toLocaleDateString()}
              <button onClick={() => handleDelete(run._id)}> Slett</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RunList;