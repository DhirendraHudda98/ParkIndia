import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeSlash,
  Warning,
  Wrench,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export function AdminRealTimeMonitoring() {
  const { t } = useTranslation();
  const { designTheme } = useTheme();
  const [monitoringData, setMonitoringData] = useState({
    slots: [],
    occupancy: 0,
    lastUpdated: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isIndia = designTheme === 'india';
  const isVoid = designTheme === 'void';

  // Load monitoring data
  const loadMonitoringData = useCallback(async () => {
    try {
      setLoading(true);
      // Load real-time data
      // This would typically come from an API call
      setMonitoringData({
        slots: [
          { id: 1, name: 'Parking Lot A', available: 15, total: 20 },
          { id: 2, name: 'Parking Lot B', available: 8, total: 10 },
          { id: 3, name: 'Parking Lot C', available: 25, total: 30 }
        ],
        occupancy: 0.75,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  // In a real implementation, this would connect to a WebSocket for real-time updates
  // For now, we'll simulate real-time updates with an interval
  useEffect(() => {
    const interval = setInterval(() => {
      loadMonitoringData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [loadMonitoringData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
            {t('admin.monitoring.title')}
          </h1>
          <p className={`mt-1 ${isIndia ? 'text-[#000080]/70' : 'text-surface-500 dark:text-surface-400'}`}>
            {t('admin.monitoring.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {monitoringData.slots.map((slot, index) => (
          <motion.div 
            key={slot.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`rounded-2xl border p-4 transition-colors ${
              isVoid 
                ? 'bg-slate-900 border-slate-800' 
                : isIndia 
                ? 'bg-white border-[#FF9933]/20 shadow-sm' 
                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${isIndia ? 'text-[#000080]' : 'text-surface-900 dark:text-white'}`}>
                {slot.name}
              </h3>
              <div className="text-right">
                <p className={`text-sm ${isIndia ? 'text-[#000080]/60' : 'text-surface-500 dark:text-surface-400'}`}>
                  {slot.available}/{slot.total} slots available
                </p>
                <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mt-2">
                  <div 
                    className="bg-blue-600 h-4 rounded-full" 
                    style={{ width: `${(slot.available / slot.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}