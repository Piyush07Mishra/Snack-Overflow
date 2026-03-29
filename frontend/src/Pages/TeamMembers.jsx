import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

const TeamMembers = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/manager/team")
      .then((r) => setTeam(r.data.team || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">My Team</h1>
      <div className="bg-white rounded-sm border overflow-hidden">
        {loading ? (
          <p className="p-8 text-sm text-gray-400">Loading...</p>
        ) : team.length === 0 ? (
          <p className="p-8 text-sm text-gray-400">No team members assigned.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {team.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
};

export default TeamMembers;
