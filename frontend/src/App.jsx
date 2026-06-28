import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './components/Video/Video';
import HomeComponent, { GuestHomeComponent } from './pages/home';
import History from './pages/history';
  


function App() {
  return (
    <div className="App">

      <Router>

        <AuthProvider>


          <Routes>

            <Route path='/' element={<LandingPage />} />

            <Route path='/auth' element={<Authentication />} />
            <Route path='/login' element={<Authentication initialMode="login" />} />
            <Route path='/signup' element={<Authentication initialMode="signup" />} />

            <Route path='/home' element={<HomeComponent />} />
            <Route path='/join' element={<GuestHomeComponent />} />
            <Route path='/history' element={<History />} />
            <Route path='/room/:url' element={<VideoMeetComponent />} />
            <Route path='/:url' element={<VideoMeetComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
