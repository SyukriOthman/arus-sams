import React from 'react';
import Card from "../components/ui/Card";

export default function AssetAdditionalDetails({ form, errors, handleInputChange, isReadOnly }) {
  const inputCls = (field) => `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-colors ${
    errors[field] ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:ring-teal-400'
  }`;

  return (
    <Card className="p-6 space-y-5">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Financial & Technical Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Brand / Manufacturer</label>
            <input 
              value={form.brand}
              onChange={handleInputChange('brand')}
              disabled={isReadOnly}
              className={inputCls('brand')}
              placeholder="e.g. HP, Cisco, IKEA"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model Name/No.</label>
            <input 
              value={form.model}
              onChange={handleInputChange('model')}
              disabled={isReadOnly}
              className={inputCls('model')}
              placeholder="e.g. Precision 3660"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Manufacturer Serial Number</label>
            <input 
              value={form.manufacturerSerial}
              onChange={handleInputChange('manufacturerSerial')}
              disabled={isReadOnly}
              className={inputCls('manufacturerSerial')}
              placeholder="e.g. SN-123456789"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acquisition Price (RM)</label>
            <input 
              type="number"
              step="0.01"
              value={form.acquisitionPrice}
              onChange={handleInputChange('acquisitionPrice')}
              disabled={isReadOnly}
              className={inputCls('acquisitionPrice')}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Received Date</label>
            <input 
              type="date"
              value={form.receivedDate}
              onChange={handleInputChange('receivedDate')}
              disabled={isReadOnly}
              className={inputCls('receivedDate')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acquisition Method</label>
            <select 
              value={form.acquisitionMethod}
              onChange={handleInputChange('acquisitionMethod')}
              disabled={isReadOnly}
              className={inputCls('acquisitionMethod')}
            >
              <option value="Purchase">Purchase</option>
              <option value="Donation">Donation</option>
              <option value="Transfer">Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Specifications / Notes</label>
        <textarea 
          value={form.specifications}
          onChange={handleInputChange('specifications')}
          disabled={isReadOnly}
          rows={4}
          className={`${inputCls('specifications')} resize-none`}
          placeholder="Enter technical specs or other important remarks..."
        />
      </div>
    </Card>
  );
}
