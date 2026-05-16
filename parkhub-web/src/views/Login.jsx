import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CarFront, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import * as THREE from 'three';
import { useAuth } from '../context/AuthContext';
import { FormField, FormInput } from '../components/ui/FormField';
import { OAuthButtons } from '../components/OAuthButtons';
import { SSOButtons } from '../components/SSOButtons';
import { APP_VERSION } from '../lib/appVersion';

const loginSchema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

function ParkingScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x06111b, 10, 28);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(6.5, 7.5, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xb8e3d3, 1.4);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(6, 10, 6);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x34d399, 0.6);
    fillLight.position.set(-8, 4, -6);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshStandardMaterial({ color: 0x07141f, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    const grid = new THREE.GridHelper(18, 18, 0x2dd4bf, 0x0f2a35);
    grid.position.y = 0.001;
    scene.add(grid);

    const parkingGroup = new THREE.Group();

    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 4.6),
      new THREE.MeshStandardMaterial({ color: 0x0b1724, roughness: 1 })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, 0.01, 0.4);
    parkingGroup.add(lane);

    const bayMaterial = new THREE.MeshStandardMaterial({ color: 0x123041, roughness: 0.9 });
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const bayPositions = [-4.6, -2.8, -1, 0.8, 2.6, 4.4];

    bayPositions.forEach((x, index) => {
      const bay = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 2.2), bayMaterial);
      bay.position.set(x, 0.04, -0.65);
      bay.rotation.y = index % 2 === 0 ? 0.08 : -0.08;
      parkingGroup.add(bay);

      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.03, 0.08), stripeMaterial);
      stripe.position.set(x, 0.12, 0.42);
      parkingGroup.add(stripe);
    });

    const carBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.55, 0.95),
      new THREE.MeshStandardMaterial({ color: 0x34d399, metalness: 0.3, roughness: 0.45 })
    );
    carBody.position.set(0, 0.45, 2.8);
    parkingGroup.add(carBody);

    const carCabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.42, 0.82),
      new THREE.MeshStandardMaterial({ color: 0x99f6e4, metalness: 0.2, roughness: 0.3, transparent: true, opacity: 0.85 })
    );
    carCabin.position.set(0.12, 0.82, 2.72);
    parkingGroup.add(carCabin);

    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1 });
    const wheelGeometry = new THREE.CylinderGeometry(0.14, 0.14, 0.16, 18);
    [
      [-0.62, 0.18, 3.1],
      [0.62, 0.18, 3.1],
      [-0.62, 0.18, 2.45],
      [0.62, 0.18, 2.45],
    ].forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      parkingGroup.add(wheel);
    });

    const indicator = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 1.5 })
    );
    indicator.position.set(-5.4, 0.65, -2.4);
    parkingGroup.add(indicator);

    scene.add(parkingGroup);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const t = performance.now() * 0.0004;
      parkingGroup.rotation.y = Math.sin(t) * 0.18;
      carBody.position.x = Math.sin(t * 1.8) * 0.18;
      carCabin.position.x = 0.12 + Math.sin(t * 1.8) * 0.18;
      indicator.position.y = 0.65 + Math.sin(t * 4) * 0.12;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function onSubmit(data) {
    setServerError(null);
    const result = await login(data.username, data.password, twoFactorCode || undefined);
    if (result.success) {
      navigate('/', { replace: true });
      return;
    }
    if (result.requires2fa) {
      setTwoFactorRequired(true);
      return;
    }
    setServerError(result.error || t('auth.loginError'));
  }

  function autofillDemo() {
    setValue('username', 'demo@parkindia.in');
    setValue('password', 'demo');
  }

  return (
    <main className="min-h-dvh bg-white dark:bg-surface-950 flex">
      <div className="hidden lg:flex lg:w-[45%] bg-surface-950 dark:bg-surface-900 relative items-end p-12 overflow-hidden isolate">
        <div className="absolute inset-0">
          <ParkingScene />
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-950/70 to-primary-950/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%)]" />

        <motion.div
          className="absolute top-0 left-0 w-full h-1"
          style={{ background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400), var(--color-accent-400), var(--color-primary-500))', backgroundSize: '200% 100%' }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        <div className="absolute top-[20%] right-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-primary-500/15 to-accent-500/10 blur-3xl" />
        <div className="absolute bottom-[30%] left-[5%] w-48 h-48 rounded-full bg-gradient-to-tr from-primary-400/10 to-cyan-400/8 blur-3xl" />

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative z-10 max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <CarFront className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">ParkIndia</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight whitespace-pre-line" style={{ letterSpacing: '-0.02em' }}>
            {t('auth.heroTitle')}
          </h2>
          <p className="text-surface-400 text-sm leading-relaxed max-w-sm">
            {t('auth.heroSubtitle')}
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <Link
            to="/welcome"
            className="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-primary-600 mb-8 transition-colors lg:hidden"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('auth.back')}
          </Link>

          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <CarFront className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white tracking-tight">ParkIndia</span>
          </div>

          <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-1" style={{ letterSpacing: '-0.02em' }}>
            {t('auth.login')}
          </h1>
          <p className="text-surface-600 dark:text-surface-300 text-sm mb-8">
            {t('auth.loginSubtitle')}
          </p>

          <OAuthButtons />
          <SSOButtons />

          <button
            type="button"
            id="demo-autofill"
            onClick={autofillDemo}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-sm text-primary-800 dark:text-primary-300 mb-6 w-full text-left cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-950/50 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
            {t('auth.demoHint')}
          </button>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField label={t('auth.email')} htmlFor="username" error={errors.username}>
              <FormInput
                registration={register('username')}
                hasError={!!errors.username}
                id="username"
                type="text"
                placeholder="demo@parkindia.in"
                autoComplete="username"
              />
            </FormField>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('auth.password')}
                </label>
                <Link to="/forgot-password" className="text-xs text-primary-700 dark:text-primary-400 hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <FormInput
                  registration={register('password')}
                  hasError={!!errors.password}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="demo"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {twoFactorRequired && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label htmlFor="two-factor-code" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
                  {t('auth.twoFactorCode', 'Two-factor authentication code')}
                </label>
                <input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  placeholder="123456"
                  aria-invalid={!!serverError}
                  aria-describedby={serverError ? 'two-factor-hint two-factor-error' : 'two-factor-hint'}
                  aria-errormessage={serverError ? 'two-factor-error' : undefined}
                />
                <p id="two-factor-hint" className="text-xs text-surface-500 dark:text-surface-400">
                  {t('auth.twoFactorHint', 'Enter the 6-digit code from your authenticator app.')}
                </p>
              </motion.div>
            )}

            {serverError && (
              <motion.p
                id="two-factor-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {serverError}
              </motion.p>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting || (twoFactorRequired && twoFactorCode.length < 6)}
              className={`btn btn-primary w-full py-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/15 ${isSubmitting ? 'btn-shimmer' : ''}`}
            >
              {isSubmitting ? (
                <><LoaderCircle className="w-4 h-4 animate-spin" /> {t('auth.loggingIn')}</>
              ) : twoFactorRequired ? (
                t('auth.verifyCode', 'Verify code')
              ) : (
                t('auth.signIn')
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>

          <p className="text-center text-xs text-surface-500 dark:text-surface-400 mt-8">
            ParkIndia v{APP_VERSION}
          </p>
        </motion.div>
      </div>
    </main>
  );
}
