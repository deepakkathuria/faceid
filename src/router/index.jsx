import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Booking from '../pages/Booking';
import SearchRooms from '../pages/SearchRooms';
import FaceMatch from '../pages/FaceMatch';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/" element={<SearchRooms />} />
                <Route path="/face-match" element={<FaceMatch />} /> {/* New Route */}


      </Routes>
    </BrowserRouter>
  );
}