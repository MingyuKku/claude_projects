import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createMemoryRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation,
} from "react-router";

import { CustomerCenterBigbirdPage } from "./CustomerCenterBigbirdPage";

const mocks = vi.hoisted(() => ({
  isDesktop: true,
  useRealtimeConversation: vi.fn(),
}));

const inquiries = [
  { threadIdx: 101, status: "consulting", isRealtime: true },
  { threadIdx: 102, status: "done", isRealtime: true },
];

vi.mock("@/entities/inquiry", () => ({
  useBigbirdInquiries: () => ({
    inquiries,
    isLoading: false,
    isError: false,
    mutate: vi.fn(),
  }),
}));
vi.mock("@/features/realtime-consultation", () => ({
  IS_REALTIME_WRITE_ENABLED: true,
  RealtimeComposer: () => null,
  RealtimeLockAlert: ({
    open,
    onLeave,
  }: {
    open: boolean;
    onLeave: () => void;
  }) => (open ? <button onClick={onLeave}>락 알림 닫기</button> : null),
  useRealtimeConversation: mocks.useRealtimeConversation,
}));
vi.mock("@/shared/lib/useMediaQuery", () => ({
  useMediaQuery: () => mocks.isDesktop,
}));
vi.mock("@/widgets/bigbird-inquiry-workspace", () => ({
  toStatusFilter: () => "all",
  BigbirdInquiryWorkspace: ({ children }: { children: React.ReactNode }) => (
    <div>
      {inquiries.map(({ threadIdx }) => (
        <Link key={threadIdx} to={`/customer-center/bigbird/${threadIdx}`}>
          문의 {threadIdx}로 이동
        </Link>
      ))}
      {children}
    </div>
  ),
  BigbirdInquiryConversation: ({
    inquiry,
  }: {
    inquiry: { threadIdx: number };
  }) => <p>대화 {inquiry.threadIdx}</p>,
}));

const session = { displayName: "bigbird", threadUserIdx: 5971 };

function LocationProbe() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function renderPage(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: (
          <>
            <Outlet context={session} />
            <LocationProbe />
          </>
        ),
        children: [
          {
            path: "/customer-center/bigbird/:threadIdx?",
            element: <CustomerCenterBigbirdPage />,
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(<RouterProvider router={router} />);
}

const LOCK_ALERT = "락 알림 닫기";

beforeEach(() => {
  mocks.isDesktop = true;
  // 101번 문의만 다른 곳이 상담 중이라 락이 막힘.
  mocks.useRealtimeConversation.mockImplementation(
    ({ inquiry }: { inquiry?: { threadIdx: number } }) => ({
      lock: inquiry?.threadIdx === 101 ? "blocked" : "held",
      canSend: false,
    }),
  );
});

describe("실시간 상담 락 알림", () => {
  it("PC에서 자동 선택된 문의가 막혀 있으면 알림을 띄우고, 닫으면 그 자리에 남는다", async () => {
    renderPage("/customer-center/bigbird");

    await userEvent.click(await screen.findByText(LOCK_ALERT));

    expect(screen.queryByText(LOCK_ALERT)).not.toBeInTheDocument();
    expect(screen.getByText("대화 101")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/customer-center/bigbird",
    );
    expect(screen.getByTestId("location")).not.toHaveTextContent("101");
  });

  it("다른 문의로 옮겼다가 돌아오면 알림을 다시 띄운다", async () => {
    renderPage("/customer-center/bigbird");
    await userEvent.click(await screen.findByText(LOCK_ALERT));

    await userEvent.click(screen.getByText("문의 102로 이동"));
    expect(screen.queryByText(LOCK_ALERT)).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("문의 101로 이동"));
    expect(await screen.findByText(LOCK_ALERT)).toBeInTheDocument();
  });

  it("주소로 직접 연 문의에서 닫으면 목록으로 돌아가고 알림이 반복되지 않는다", async () => {
    renderPage("/customer-center/bigbird/101");

    await userEvent.click(await screen.findByText(LOCK_ALERT));

    expect(screen.getByTestId("location")).toHaveTextContent(
      /^\/customer-center\/bigbird$/,
    );
    // 목록으로 돌아오면 같은 문의가 자동 선택되지만 알림은 다시 뜨지 않음.
    expect(screen.getByText("대화 101")).toBeInTheDocument();
    expect(screen.queryByText(LOCK_ALERT)).not.toBeInTheDocument();
  });

  it("TAB·MO에서는 목록 뒤에 가려진 자동 선택 문의의 락을 잡지 않는다", () => {
    mocks.isDesktop = false;
    renderPage("/customer-center/bigbird");

    expect(screen.queryByText(LOCK_ALERT)).not.toBeInTheDocument();
    expect(mocks.useRealtimeConversation).toHaveBeenCalledWith(
      expect.objectContaining({ inquiry: undefined }),
    );
  });
});
