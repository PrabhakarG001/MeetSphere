import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import Signup from './pages/signup';
import { AuthProvider } from './contexts/AuthContext';
import VideoMeetComponent from './components/Video/Video';
import PreJoinComponent from './components/Video/PreJoin';
import HomeComponent, { GuestHomeComponent } from './pages/home';
import History from './pages/history';
import AccountSelection from './pages/AccountSelection';
  


function App() {
  return (
    <div className="App">

      <Router>

        <AuthProvider>


          <Routes>

            <Route path='/' element={<LandingPage />} />

            <Route path='/auth' element={<Authentication />} />
            <Route path='/login' element={<Authentication initialMode="login" />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/account-select' element={<AccountSelection />} />

            <Route path='/home' element={<HomeComponent />} />
            <Route path='/join' element={<GuestHomeComponent />} />
            <Route path='/history' element={<History />} />
            <Route path='/join/:url' element={<PreJoinComponent />} />
            <Route path='/meeting/:url' element={<VideoMeetComponent />} />
            <Route path='/meet/:url' element={<PreJoinComponent />} />
            <Route path='/room/:url' element={<PreJoinComponent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;


