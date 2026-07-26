import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Feed } from "./components/Feed";
import { Analytics } from "./components/Analytics";
import { Header } from "./components/Header";
import './App.css'

function App() {
  return (
    <>

      <Router>
        <Header title="Video Analytics" />

        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/analytics" element={<Analytics />} />

        </Routes>
      </Router>
    </>
  )
}
export default App;
