import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "../pages/Welcome";
import Register from "../pages/Auth/Register";
import Login from "../pages/Auth/Login";
import InvitationRegister from "../pages/Auth/InvitationRegister";

// Gerer par les patients
import ProfilPatient from "../pages/Patient/Profil";
import ProfileEditPatient from "../pages/Patient/EditProfil";
import PatientDashboard from "../pages/Patient/Dashboard";
import StructureViewPatient from "../pages/Patient/Structure";
import ShowStructureViewPatient from "../pages/Patient/ShowStructure";
import DoctorViewPatient from "../pages/Patient/Doctor";

import DocteurDashboard from "../pages/Docteur/Dashboard";

// Gerer par l'administrateur de structure
import AdminStructureDashboard from "../pages/AdminStructure/Dashboard";

import DocteurViewAdminStr from "../pages/AdminStructure/Doctor";
import ShowDocteurViewAdminStr from "../pages/AdminStructure/ShowDoctor"; 
import EditDocteurViewAdminStr from "../pages/AdminStructure/EditDoctor";


// Gerer par l'administrateur systeme
import AdminSystemeDashboard from "../pages/AdminSysteme/Dashboard";

import Patient from "../pages/AdminSysteme/Patient";
import ShowPatient from "../pages/AdminSysteme/ShowPatient";
import EditPatient from "../pages/AdminSysteme/EditPatient";

import AdminSysteme from "../pages/AdminSysteme/AdminSysteme";
import ShowAdminSysteme from "../pages/AdminSysteme/ShowAdminSysteme"; 
import EditAdminSysteme from "../pages/AdminSysteme/EditAdminSysteme";

import AdminStructure from "../pages/AdminSysteme/AdminStructure";
import ShowAdminStructure from "../pages/AdminSysteme/ShowAdminStructure"; 
import EditAdminStructure from "../pages/AdminSysteme/EditAdminStructure";

import Docteur from "../pages/AdminSysteme/Docteur";
import ShowDocteur from "../pages/AdminSysteme/ShowDocteur"; 
import EditDocteur from "../pages/AdminSysteme/EditDocteur";

import Structure from "../pages/AdminSysteme/Structures";

import Invitation from "../pages/AdminSysteme/Invitation";

import Profil from "../pages/AdminSysteme/Profil";
import EditProfil from "../pages/AdminSysteme/EditProfil";

import NotFound from "../pages/NotFound";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<PublicRoute> <Register /> </PublicRoute>} />
        <Route path="/login" element={<PublicRoute> <Login /> </PublicRoute>} />
        <Route path="/invitation-register" element={<PublicRoute> <InvitationRegister /> </PublicRoute>} />

        {/* Protégées */}

        {/* Patient */}
        <Route path="/patient/profil" element={ <PrivateRoute allowedRoles={[0]}> <ProfilPatient /> </PrivateRoute> } />
        <Route path="/patient/dashboard" element={ <PrivateRoute allowedRoles={[0]}> <PatientDashboard /> </PrivateRoute> } />
        <Route path="/patient/profil/modifier" element={ <PrivateRoute allowedRoles={[0]}> <ProfileEditPatient /> </PrivateRoute>} />
        <Route path="/patient/view/structure" element={ <PrivateRoute allowedRoles={[0]}> <StructureViewPatient /> </PrivateRoute>} />
        <Route path="/patient/view/structure/:id" element={ <PrivateRoute allowedRoles={[0]}> <ShowStructureViewPatient /> </PrivateRoute>} />
        <Route path="/patient/view/doctor" element={ <PrivateRoute allowedRoles={[0]}> <DoctorViewPatient /> </PrivateRoute>} />
        
        {/* Docteur */}
        <Route path="/docteur/dashboard" element={ <PrivateRoute allowedRoles={[1]}> <DocteurDashboard /> </PrivateRoute> } />

        {/* Admin Structure */}
        <Route path="/admin-structure/dashboard" element={ <PrivateRoute allowedRoles={[2]}><AdminStructureDashboard /></PrivateRoute>} />

        <Route path="/admin-structure/view/docteur" element={<PrivateRoute allowedRoles={[2]}> <DocteurViewAdminStr /> </PrivateRoute>} />
        <Route path="/admin-structure/show/doctor/:id" element={<PrivateRoute allowedRoles={[2]}> <ShowDocteurViewAdminStr />  </PrivateRoute>} />
        <Route path="/admin-structure/edit/doctor/:id" element={<PrivateRoute allowedRoles={[2]}> <EditDocteurViewAdminStr />  </PrivateRoute>} />

        {/* Admin Système */}
        <Route path="/admin-systeme/dashboard" element={<PrivateRoute allowedRoles={[3]}><AdminSystemeDashboard /></PrivateRoute>} />

        <Route path="/admin-systeme/view/admin-systeme" element={<PrivateRoute allowedRoles={[3]}> <AdminSysteme /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowAdminSysteme />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/admin-systeme/:id" element={<PrivateRoute allowedRoles={[3]}> <EditAdminSysteme />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/admin-structure" element={<PrivateRoute allowedRoles={[3]}> <AdminStructure /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/admin-structure/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowAdminStructure />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/admin-structure/:id" element={<PrivateRoute allowedRoles={[3]}> <EditAdminStructure />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/docteur" element={<PrivateRoute allowedRoles={[3]}> <Docteur /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/doctor/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowDocteur />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/doctor/:id" element={<PrivateRoute allowedRoles={[3]}> <EditDocteur />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/patient" element={<PrivateRoute allowedRoles={[3]}> <Patient /> </PrivateRoute>} />
        <Route path="/admin-systeme/show/patient/:id" element={<PrivateRoute allowedRoles={[3]}> <ShowPatient />  </PrivateRoute>} />
        <Route path="/admin-systeme/edit/patient/:id" element={<PrivateRoute allowedRoles={[3]}> <EditPatient />  </PrivateRoute>} />

        <Route path="/admin-systeme/view/structures" element={<PrivateRoute allowedRoles={[3]}> <Structure /> </PrivateRoute>} />

        <Route path="/admin-systeme/view/invitations" element={<PrivateRoute allowedRoles={[3]}> <Invitation /> </PrivateRoute>} />

        <Route path="/admin-systeme/view/profil" element={<PrivateRoute allowedRoles={[3]}> <Profil /> </PrivateRoute>} />
        <Route path="/admin-systeme/edit/profil" element={<PrivateRoute allowedRoles={[3]}> <EditProfil /> </PrivateRoute>} />



        {/* Catch-all pour les routes inexistantes */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}
