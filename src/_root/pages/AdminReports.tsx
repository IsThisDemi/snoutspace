import { useGetReports, useUpdateReportStatus } from "@/lib/react-query/queries";
import Loader from "@/components/shared/Loader";
import { multiFormatDateString } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  reviewed: "text-green-400 bg-green-400/10",
  dismissed: "text-light-4 bg-dark-5/40",
};

const AdminReports = () => {
  const { data, isLoading } = useGetReports();
  const { mutate: updateStatus } = useUpdateReportStatus();

  const reports = data?.documents ?? [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl mb-6">
          <img src="/assets/icons/filter.svg" width={36} height={36} alt="reports" className="invert-white" />
          <h2 className="h3-bold md:h2-bold text-left w-full">Moderation Reports</h2>
        </div>

        {isLoading ? (
          <div className="flex-center w-full py-20"><Loader /></div>
        ) : reports.length === 0 ? (
          <p className="text-light-4 small-regular text-center py-20">No reports yet.</p>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-5xl">
            {reports.map((r: any) => (
              <div key={r.id} className="glass-card rounded-xl p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`tiny-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                      <span className="tiny-medium text-light-4 bg-dark-4 px-2 py-0.5 rounded-full capitalize">
                        {r.targetType}
                      </span>
                    </div>
                    <p className="small-regular text-light-1 mt-1">{r.reason}</p>
                    <p className="tiny-medium text-light-4">
                      Target ID: <span className="text-primary-500/70 font-mono">{r.targetId}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <img
                        src={(r.reporter as any)?.imageUrl || "/assets/icons/profile-placeholder.svg"}
                        className="w-6 h-6 rounded-full"
                        alt=""
                      />
                      <span className="tiny-medium text-light-3">{(r.reporter as any)?.username}</span>
                    </div>
                    <span className="tiny-medium text-light-4">{multiFormatDateString(r.createdAt)}</span>
                  </div>
                </div>

                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus({ reportId: r.id, status: "reviewed" })}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 tiny-medium hover:bg-green-500/30 transition"
                    >
                      Mark reviewed
                    </button>
                    <button
                      onClick={() => updateStatus({ reportId: r.id, status: "dismissed" })}
                      className="px-3 py-1.5 rounded-lg bg-dark-4 text-light-3 tiny-medium hover:bg-dark-5 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
