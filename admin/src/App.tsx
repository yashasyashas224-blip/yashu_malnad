import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  Map,
  Users,
  QrCode,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  Plus,
  AlertTriangle,
  History,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  Layers,
  Save,
  Send
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map_editor' | 'users' | 'qr_checkpoints' | 'analytics' | 'audit_logs'>('map_editor');
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('mce_admin_token') || '');
  const [adminUser, setAdminUser] = useState<any>(() => {
    const saved = localStorage.getItem('mce_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Admin Login State
  const [loginEmail, setLoginEmail] = useState('principal@mcehassan.ac.in');
  const [loginPass, setLoginPass] = useState('MceAdmin@2025');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Map & Data States
  const [buildings, setBuildings] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [qrManifest, setQrManifest] = useState<any[]>([]);
  const [mapVersions, setMapVersions] = useState<any[]>([]);

  // Map Editor State
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('outdoor_junction');
  const [newCoordinates, setNewCoordinates] = useState<[number, number]>([76.10354, 13.02365]);
  const [publishNotes, setPublishNotes] = useState('');
  const [msg, setMsg] = useState('');

  // Perform Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: loginEmail, password: loginPass })
    })
      .then(res => res.json())
      .then(data => {
        setLoginLoading(false);
        if (data.success && (data.user.role === 'campus_admin' || data.user.role === 'super_admin')) {
          setAdminUser(data.user);
          setAdminToken(data.token);
          localStorage.setItem('mce_admin_user', JSON.stringify(data.user));
          localStorage.setItem('mce_admin_token', data.token);
        } else {
          setLoginError(data.message || 'You must have administrative privileges to access this dashboard.');
        }
      })
      .catch(() => {
        setLoginLoading(false);
        setLoginError('Could not connect to authentication server.');
      });
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setAdminToken('');
    localStorage.removeItem('mce_admin_user');
    localStorage.removeItem('mce_admin_token');
  };

  // Fetch initial data
  const loadDashboardData = () => {
    if (!adminToken) return;

    fetch('/api/campus/buildings')
      .then(res => res.json())
      .then(data => data.success && setBuildings(data.buildings || []));

    fetch('/api/navigation/nodes')
      .then(res => res.json())
      .then(data => data.success && setNodes(data.nodes || []));

    fetch('/api/navigation/edges')
      .then(res => res.json())
      .then(data => data.success && setEdges(data.edges || []));

    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => res.json())
      .then(data => data.success && setUsersList(data.users || []));

    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => res.json())
      .then(data => data.success && setAnalytics(data.analytics));

    fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => res.json())
      .then(data => data.success && setAuditLogs(data.logs || []));

    fetch('/api/admin/qr/manifest', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => res.json())
      .then(data => data.success && setQrManifest(data.checkpoints || []));

    fetch('/api/admin/map/versions', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => res.json())
      .then(data => data.success && setMapVersions(data.versions || []));
  };

  useEffect(() => {
    loadDashboardData();
  }, [adminToken]);

  // Initialize Map in Map Editor Tab
  useEffect(() => {
    if (activeTab !== 'map_editor' || !mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap | MCE Hassan'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      center: [76.10354, 13.02365],
      zoom: 16.5,
      pitch: 20
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      setNewCoordinates([Number(e.lngLat.lng.toFixed(5)), Number(e.lngLat.lat.toFixed(5))]);
    });

    map.on('load', () => {
      // Add Walkway Lines
      fetch('/api/campus/geojson')
        .then(res => res.json())
        .then(data => {
          if (!map.getSource('mce-campus')) {
            map.addSource('mce-campus', { type: 'geojson', data });

            map.addLayer({
              id: 'boundary',
              type: 'line',
              source: 'mce-campus',
              filter: ['==', 'type', 'boundary'],
              paint: { 'line-color': '#0f2c59', 'line-width': 3 }
            });

            map.addLayer({
              id: 'walkways',
              type: 'line',
              source: 'mce-campus',
              filter: ['==', 'type', 'walkway'],
              paint: { 'line-color': '#64748b', 'line-width': 4 }
            });
          }
        });
    });

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, [activeTab]);

  // Toggle Edge Blockage (Obstacle / Maintenance)
  const handleToggleBlock = (edgeId: string, currentStatus: boolean) => {
    const reason = !currentStatus ? prompt('Enter reason for closing this pathway (e.g. Utility Maintenance):', 'Under Repair') : '';
    if (!currentStatus && !reason) return;

    fetch('/api/admin/map/edge/block', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        edgeId,
        isBlocked: !currentStatus,
        blockedReason: reason
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMsg(data.message);
          loadDashboardData();
          setTimeout(() => setMsg(''), 4000);
        }
      });
  };

  // Add / Save Navigation Node
  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName) return;

    fetch('/api/admin/map/node', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: newNodeName,
        type: newNodeType,
        coordinates: newCoordinates
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMsg(`Node "${newNodeName}" saved.`);
          setNewNodeName('');
          loadDashboardData();
          setTimeout(() => setMsg(''), 4000);
        }
      });
  };

  // Publish Verified Map Version
  const handlePublishMap = () => {
    fetch('/api/admin/map/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ notes: publishNotes || 'Surveyed MCE updates' })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMsg(data.message);
          setPublishNotes('');
          loadDashboardData();
          setTimeout(() => setMsg(''), 4000);
        }
      });
  };

  // Update User Status
  const handleUserStatus = (userId: string, status: string) => {
    fetch(`/api/admin/users/${userId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMsg(data.message);
          loadDashboardData();
          setTimeout(() => setMsg(''), 4000);
        }
      });
  };

  // If not logged in, show Admin Login Portal
  if (!adminUser) {
    return (
      <div className="w-screen h-screen bg-[#0f2c59] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#0f2c59] border-2 border-[#c59b27] flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-md">
              <span className="text-[#c59b27]">MCE</span>
            </div>
            <h2 className="font-extrabold text-xl text-slate-900 mt-4">MCE Administration Portal</h2>
            <p className="text-xs text-slate-500 mt-1">Campus Mapping Engine & Verification Desk</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Administrator Official Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admin Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-[#0f2c59] hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-98"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In as Administrator'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#0f2c59] text-white px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-[#c59b27] flex items-center justify-center font-bold text-sm text-[#c59b27]">
            MCE
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight">MCE Hassan • Campus Administration</h1>
            <p className="text-[11px] text-slate-300">Intelligent Navigation & Spatial Mapping System</p>
          </div>
        </div>

        {/* Global tabs */}
        <nav className="flex items-center space-x-1 bg-white/10 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('map_editor')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'map_editor' ? 'bg-[#c59b27] text-slate-900 font-bold shadow' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'users' ? 'bg-[#c59b27] text-slate-900 font-bold shadow' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Verifications</span>
          </button>
          <button
            onClick={() => setActiveTab('qr_checkpoints')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'qr_checkpoints' ? 'bg-[#c59b27] text-slate-900 font-bold shadow' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Checkpoints</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-[#c59b27] text-slate-900 font-bold shadow' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit_logs' ? 'bg-[#c59b27] text-slate-900 font-bold shadow' : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </nav>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right">
            <span className="font-bold text-white block">{adminUser.name}</span>
            <span className="text-[10px] text-amber-300 uppercase tracking-wider font-semibold">{adminUser.role}</span>
          </div>
          <button
            onClick={handleAdminLogout}
            className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Toast Notification */}
      {msg && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center shrink-0 animate-in fade-in">
          {msg}
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="flex-1 overflow-hidden relative">
        {/* TAB 1: VISUAL CAMPUS MAP EDITOR */}
        {activeTab === 'map_editor' && (
          <div className="w-full h-full flex">
            {/* Left Interactive Map Canvas */}
            <div className="flex-1 relative h-full">
              <div ref={mapContainerRef} className="admin-map-container" />
              <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 shadow">
                💡 Click on the campus map to select coordinates for new nodes or markers.
              </div>
            </div>

            {/* Right Editing Sidebar */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-10 overflow-y-auto">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-sm text-[#0f2c59]">Campus Mapping Tools</h3>
                <p className="text-xs text-slate-500">Edit walking network and obstruction status</p>
              </div>

              {/* Add Navigation Node */}
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Add Walking Node</h4>
                <form onSubmit={handleSaveNode} className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Node Name</label>
                    <input
                      type="text"
                      value={newNodeName}
                      onChange={e => setNewNodeName(e.target.value)}
                      placeholder="e.g. Mechanical Quadrangle East"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Type</label>
                      <select
                        value={newNodeType}
                        onChange={e => setNewNodeType(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="outdoor_junction">Outdoor Junction</option>
                        <option value="building_entrance">Building Entrance</option>
                        <option value="outdoor_gate">Campus Gate</option>
                        <option value="emergency_point">Emergency Point</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Coordinates</label>
                      <span className="font-mono text-[10px] text-slate-600 block py-1.5 px-2 bg-slate-50 rounded border border-slate-200 truncate">
                        {newCoordinates.join(', ')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0f2c59] hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Save Navigation Node
                  </button>
                </form>
              </div>

              {/* Pathway Obstruction / Closure Manager */}
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Pathway Blockage Toggles</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {edges.map(e => (
                    <div
                      key={e.id}
                      className="p-2 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[190px]">
                        <span className="font-semibold text-slate-800 block truncate">{e.id}</span>
                        <span className="text-[10px] text-slate-500">{e.distanceMeters}m {e.isIndoor ? '• Indoor' : ''}</span>
                        {e.isBlocked && (
                          <span className="text-[10px] text-red-600 font-bold block">⛔ {e.blockedReason || 'Blocked'}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleBlock(e.id, e.isBlocked)}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          e.isBlocked ? 'bg-emerald-600 text-white' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {e.isBlocked ? 'Reopen' : 'Block'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Versioning & Publish */}
              <div className="p-4">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2">Publish Campus Release</h4>
                <input
                  type="text"
                  value={publishNotes}
                  onChange={e => setPublishNotes(e.target.value)}
                  placeholder="Notes: e.g. Updated Mech workshop survey"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs mb-2"
                />
                <button
                  onClick={handlePublishMap}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Versioned Update</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USER VERIFICATIONS */}
        {activeTab === 'users' && (
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">MCE Student & Staff Master Verification Queue</h3>
                <p className="text-xs text-slate-500">Accounts verified against official Malnad College of Engineering rosters</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-[#0f2c59] rounded-full">
                Total Registered: {usersList.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">MCE USN / Emp ID</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{u.institutionalId}</td>
                      <td className="p-3.5 text-slate-600">{u.email}</td>
                      <td className="p-3.5">
                        <span className="capitalize px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.verificationStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.verificationStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {u.verificationStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {u.verificationStatus !== 'verified' && (
                          <button
                            onClick={() => handleUserStatus(u.id, 'verified')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Approve
                          </button>
                        )}
                        {u.verificationStatus !== 'suspended' && (
                          <button
                            onClick={() => handleUserStatus(u.id, 'suspended')}
                            className="px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QR CHECKPOINTS MANIFEST */}
        {activeTab === 'qr_checkpoints' && (
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Printable QR Checkpoints Manifest</h3>
                <p className="text-xs text-slate-500">Deploy these markers at building entrances and floor landings for indoor positioning</p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#0f2c59] text-white rounded-xl text-xs font-bold shadow hover:bg-slate-900"
              >
                🖨️ Print Checkpoint Stickers
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrManifest.map(cp => (
                <div key={cp.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded uppercase">
                        Floor {cp.floor}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-600">{cp.code}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{cp.locationName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{cp.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center font-mono text-[9px] text-slate-400">
                      [QR CODE]
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {cp.coordinates.join(', ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">MCE Campus Navigation Analytics</h3>
            <p className="text-xs text-slate-500 mb-4">Traffic insights, search trends, and navigation engine reliability</p>

            {analytics && (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Registered Students</p>
                    <p className="text-2xl font-extrabold text-[#0f2c59] mt-1">{analytics.registeredStudents}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Verified Buildings</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {analytics.verifiedBuildings} / {analytics.totalBuildings}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Route Completion Rate</p>
                    <p className="text-2xl font-extrabold text-blue-600 mt-1">{analytics.routeCompletionRate}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-400 font-semibold">Active Obstructions</p>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">{analytics.activeBlockedPathsCount}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-sm text-slate-800 mb-3">Most Searched Campus Destinations</h4>
                  <div className="space-y-2">
                    {analytics.popularDestinations?.map((d: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                        <span className="font-semibold text-slate-700">{idx + 1}. {d.name}</span>
                        <span className="font-mono font-bold text-[#0f2c59]">{d.searches} queries</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit_logs' && (
          <div className="p-6 max-w-6xl mx-auto h-full overflow-y-auto">
            <h3 className="font-extrabold text-lg text-slate-900 mb-1">Administrative Audit Logs</h3>
            <p className="text-xs text-slate-500 mb-4">Every user authorization, coordinate modification, and map publish is recorded</p>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Admin</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 font-mono text-[11px]">
                      <td className="p-3.5 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-slate-800">{l.adminName}</td>
                      <td className="p-3.5 text-[#2563eb]">{l.action}</td>
                      <td className="p-3.5 text-slate-700">{l.targetType} ({l.targetId})</td>
                      <td className="p-3.5 text-slate-600 font-sans text-xs">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
