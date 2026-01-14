import PublicLayout from "@/app/layout/publicLayout";
import { createBrowserRouter } from "react-router-dom";

import Rule from "@/app/routes/Rule";
import SiteAbout from "@/app/routes/SiteAbout";
import SiteHome from "@/app/routes/SiteHome";

import Activities from "@/app/routes/Activities";
import ActivityDetail from "@/app/routes/ActivityDetail";

import Reference from "@/app/routes/Reference";
import ReferenceDetail from "@/app/routes/ReferenceDetail";

import Notice from "@/app/routes/Notice";
import NoticeDetail from "@/app/routes/NoticeDetail";

import Gallery from "@/app/routes/Gallery";

import Support from "@/app/routes/Support";
import SupportDetail from "@/app/routes/SupportDetail";

import Cleaning from "@/app/routes/Cleaning";
import Fee from "@/app/routes/Fee";
import Library from "@/app/routes/Library";

import PostForm from "@/components/postForm/PostForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfficerPage from "./app/routes/admin/OfficerPage";
import Login from "./app/routes/Login";
import ForgotPassword from "./app/routes/ForgotPassword";
import ResetPassword from "./app/routes/ResetPassword";
import MyPage from "./app/routes/Mypage";
import Register from "./app/routes/Register";

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <SiteHome /> },
      { path: "about", element: <SiteAbout /> },
      { path: "rule", element: <Rule /> },
      { path: "login", element: <Login /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "signup", element: <Register /> },
      {
        path: "mypage",
        element: <ProtectedRoute element={<MyPage />} />,
      },
      {
        path: "officer",
        element: (
          <ProtectedRoute element={<OfficerPage />} requiredRole="admin" />
        ),
      },

      { path: "notice", element: <Notice /> },
      {
        path: "notice/write",
        element: (
          <PostForm
            categoryId={1}
            categoryName="공지"
            basePath="/notice"
          />
        ),
      },
      { path: "notice/:id", element: <NoticeDetail /> },

      { path: "activities", element: <Activities /> },
      {
        path: "activities/write",
        element: (
          <PostForm
            categoryId={2}
            categoryName="팀빌딩"
            basePath="/activities"
          />
        ),
      },
      { path: "activities/:id", element: <ActivityDetail /> },

      { path: "seminar", element: <Reference /> },

      {
        path: "seminar/KeeperSeminar/write",
        element: (
          <PostForm
            categoryId={3}
            categoryName="Keeper 세미나"
            basePath="/seminar"
          />
        ),
      },
      { path: "seminar/KeeperSeminar/:id", element: <ReferenceDetail /> },

      {
        path: "seminar/seminar/write",
        element: (
          <PostForm
            categoryId={4}
            categoryName="정보공유세미나"
            basePath="/seminar"
          />
        ),
      },
      { path: "seminar/seminar/:id", element: <ReferenceDetail /> },

      {
        path: "seminar/special/write",
        element: (
          <PostForm
            categoryId={5}
            categoryName="특강"
            basePath="/seminar"
          />
        ),
      },
      { path: "seminar/special/:id", element: <ReferenceDetail /> },

      { path: "gallery", element: <Gallery /> },

      { path: "support", element: <Support /> },
      {
        path: "support/write",
        element: (
          <PostForm
            categoryId={6}
            categoryName="문의"
            basePath="/support"
          />
        ),
      },
      { path: "support/:id", element: <SupportDetail /> },

      { path: "library", element: <Library /> },
      { path: "fee", element: <Fee /> },
      { path: "cleaning", element: <Cleaning /> },
    ],
  },
]);

export default router;
