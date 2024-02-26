"use client";

import React from 'react';
import { useCustomGoogleLogin } from './GoogleLogin';

const SignInButton: React.FC = () => {
  const { SignInWithGoogleButton } = useCustomGoogleLogin();

  return <SignInWithGoogleButton />;
};

export default SignInButton;