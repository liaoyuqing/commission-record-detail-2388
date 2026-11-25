import { Navigate, Route, Routes } from 'react-router-dom';
import CommissionRecordDetail from './pages/CommissionRecordDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/commission/records/:id" element={<CommissionRecordDetail />} />
      <Route path="/commission/records" element={<Navigate to="/commission/records/1" replace />} />
      <Route path="*" element={<Navigate to="/commission/records/1" replace />} />
    </Routes>
  );
}
