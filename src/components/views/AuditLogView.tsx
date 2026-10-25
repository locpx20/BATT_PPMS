import React, { useState } from 'react';
import { History, Search, Filter, Clock, User, Shield } from 'lucide-react';
import { User as UserType, AuditLog } from '../../types';
import { db } from '../../services/db';
import { Pagination } from '../common/Pagination';

interface AuditLogViewProps {
  currentUser: UserType;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const snapshot = db.getSnapshot();
  const logs = snapshot.auditLogs;

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entityCode && log.entityCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nhật ký Kiểm toán Hệ thống (Audit Logs)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận bất biến mọi thay đổi trạng thái, giao dịch vật lý, phê duyệt và người thực hiện
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo hành động, người thực hiện, mã hồ sơ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Đối tượng:</span>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 bg-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="PURCHASE_ASSIGNMENT">Thu mua (PURCHASE)</option>
            <option value="PRODUCTION_PLAN">Kế hoạch sản xuất (PLAN)</option>
            <option value="RAW_MATERIAL_ISSUE">Cấp NVL (ISSUE)</option>
            <option value="SHIFT_REPORT">Báo cáo ca (SHIFT_REPORT)</option>
            <option value="LOT">Lô hàng & QC (LOT)</option>
            <option value="OUTBOUND_PROPOSAL">Xuất hàng (OUTBOUND)</option>
            <option value="MACHINE_FAILURE">Sự cố máy (FAILURE)</option>
            <option value="MAINTENANCE_MATERIAL_REQUEST">Vật tư bảo trì (MATERIAL)</option>
            <option value="USER">Quản trị người dùng (USER)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Hành động</th>
                <th className="py-3 px-4">Mã hồ sơ</th>
                <th className="py-3 px-4">Chuyển trạng thái</th>
                <th className="py-3 px-4">Chi tiết nghiệp vụ & Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">[{log.actorRole}]</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{log.action}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                    {log.entityCode || log.entityId}
                  </td>
                  <td className="py-3 px-4">
                    {log.previousState || log.newState ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        {log.previousState && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {log.previousState}
                          </span>
                        )}
                        {log.previousState && log.newState && <span>→</span>}
                        {log.newState && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                            {log.newState}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-sm">
                    <p className="text-slate-600 text-xs">{log.details}</p>
                    {log.reason && (
                      <div className="mt-1 p-1.5 rounded bg-amber-50 text-amber-900 text-[11px] border border-amber-200">
                        <span className="font-semibold">Lý do: </span>
                        {log.reason}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
