import React, { useEffect, useState } from "react";
import axios from "axios";

function RunList() {
  const [runs, setRuns] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/api/runs")
      .then(res => setRuns(res.data))
      .catch(err => console.error("Error fetching runs:", err));
  }, []);

  return (
    <div>
      <h2>Treningshistorikk</h2>
      {runs.length === 0 ? (
        <p>Ingen økter ennå.</p>
      ) : (
        <ul>
          {runs.map((run) => (
            <li key={run._id}>
              {run.distance} km på {run.duration} min – {new Date(run.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RunList;