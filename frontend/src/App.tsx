import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import LogWorkout from '@/pages/LogWorkout';
import ExerciseProgress from '@/pages/ExerciseProgress';
import ExerciseDetail from '@/pages/ExerciseDetail';
import Analytics from '@/pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="log" element={<LogWorkout />} />
          <Route path="progress" element={<ExerciseProgress />} />
          <Route path="progress/:exercise" element={<ExerciseDetail />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
