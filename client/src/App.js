import React from "react";
import RunForm from "./components/runform";
import RunList from "./components/runlist";

function App() {
  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h1>🏃‍♂️ RunTracker</h1>
      <RunForm />
      <RunList />
    </div>
  );
}

export default App;
