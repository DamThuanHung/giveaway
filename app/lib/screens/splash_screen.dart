import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/auth_provider.dart';
import 'onboarding_screen.dart';
import 'app_shell.dart';
import 'auth/phone_login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _rippleController;
  late AnimationController _textController;
  late AnimationController _shimmerController;
  late AnimationController _progressController;

  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _ripple1;
  late Animation<double> _ripple2;
  late Animation<double> _titleSlide;
  late Animation<double> _titleFade;
  late Animation<double> _subtitleFade;
  late Animation<double> _shimmer;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();

    // Logo bounce in
    _logoController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _logoScale = Tween<double>(begin: 0.4, end: 1.0).animate(
      CurvedAnimation(parent: _logoController, curve: Curves.easeOutBack),
    );
    _logoFade = CurvedAnimation(parent: _logoController, curve: Curves.easeIn);

    // Ripple liên tục
    _rippleController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1800))
      ..repeat();
    _ripple1 = CurvedAnimation(parent: _rippleController, curve: Curves.easeOut);
    _ripple2 = CurvedAnimation(parent: _rippleController, curve: const Interval(0.5, 1.0, curve: Curves.easeOut));

    // Shimmer quét qua logo
    _shimmerController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _shimmer = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut),
    );

    // Text slide up
    _textController = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _titleSlide = Tween<double>(begin: 24, end: 0).animate(
      CurvedAnimation(parent: _textController, curve: Curves.easeOutCubic),
    );
    _titleFade = CurvedAnimation(parent: _textController, curve: const Interval(0.0, 0.7));
    _subtitleFade = CurvedAnimation(parent: _textController, curve: const Interval(0.4, 1.0));

    // Progress bar
    _progressController = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000));
    _progress = CurvedAnimation(parent: _progressController, curve: Curves.easeInOut);

    _runSequence();
    _navigate();
  }

  Future<void> _runSequence() async {
    _progressController.forward();
    await _logoController.forward();
    _shimmerController.forward();
    await _textController.forward();
  }

  Future<void> _navigate() async {
    // Đợi tối thiểu 800ms cho animation hiện logo + tagline mượt mà.
    // KHÔNG đợi 2.4s như cũ — user đã login nhiều lần thì splash mỗi lần
    // chậm sẽ gây phiền. Nếu user chưa login (lần đầu cài hoặc đã logout)
    // → đợi đủ 2.4s để xem branding lần đầu.
    final start = DateTime.now();
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    final prefs = await SharedPreferences.getInstance();
    final onboardingDone = prefs.getBool('onboarding_done') ?? false;
    if (!mounted) return;

    if (!onboardingDone) {
      // User mới — đợi thêm để hoàn thành 2.4s animation trước khi push Onboarding
      final elapsed = DateTime.now().difference(start).inMilliseconds;
      if (elapsed < 2400) {
        await Future.delayed(Duration(milliseconds: 2400 - elapsed));
      }
      if (!mounted) return;
      Navigator.pushReplacement(context, _fadeRoute(const OnboardingScreen()));
      return;
    }

    final auth = context.read<AuthProvider>();
    // Bug fix: trước đây while(isLoading) không có timeout — nếu AuthProvider
    // bị treo (token storage throw, network slow), splash loop vô tận.
    // Giờ cap 5s; sau đó coi như chưa login → push login screen.
    final waitStart = DateTime.now();
    while (auth.isLoading) {
      if (DateTime.now().difference(waitStart).inSeconds >= 5) break;
      await Future.delayed(const Duration(milliseconds: 100));
    }
    if (!mounted) return;

    // User đã login → push ngay (đã đợi 800ms cho animation, đủ).
    // User chưa login → đợi đủ 2.4s để xem branding nếu chưa.
    if (!auth.isAuth) {
      final elapsed = DateTime.now().difference(start).inMilliseconds;
      if (elapsed < 2400) {
        await Future.delayed(Duration(milliseconds: 2400 - elapsed));
      }
      if (!mounted) return;
    }

    Navigator.pushReplacement(
      context,
      _fadeRoute(auth.isAuth ? const AppShell() : const PhoneLoginScreen()),
    );
  }

  PageRouteBuilder _fadeRoute(Widget page) => PageRouteBuilder(
    pageBuilder: (_, __, ___) => page,
    transitionsBuilder: (_, anim, __, child) => FadeTransition(opacity: anim, child: child),
    transitionDuration: const Duration(milliseconds: 600),
  );

  @override
  void dispose() {
    _logoController.dispose();
    _rippleController.dispose();
    _textController.dispose();
    _shimmerController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1A3C2A), Color(0xFF2D6A4F), Color(0xFF52B788)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Background decoration circles
            Positioned(
              top: -80,
              right: -80,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04),
                ),
              ),
            ),
            Positioned(
              bottom: -100,
              left: -60,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04),
                ),
              ),
            ),

            // Nội dung chính
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo + ripple + shimmer
                  SizedBox(
                    width: 200,
                    height: 200,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Ripple 1
                        AnimatedBuilder(
                          animation: _ripple1,
                          builder: (_, __) => Opacity(
                            opacity: (1 - _ripple1.value) * 0.25,
                            child: Container(
                              width: 110 + 90 * _ripple1.value,
                              height: 110 + 90 * _ripple1.value,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.1),
                              ),
                            ),
                          ),
                        ),
                        // Ripple 2
                        AnimatedBuilder(
                          animation: _ripple2,
                          builder: (_, __) => Opacity(
                            opacity: (1 - _ripple2.value) * 0.15,
                            child: Container(
                              width: 110 + 90 * _ripple2.value,
                              height: 110 + 90 * _ripple2.value,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withOpacity(0.08),
                              ),
                            ),
                          ),
                        ),

                        // Logo với shimmer
                        FadeTransition(
                          opacity: _logoFade,
                          child: ScaleTransition(
                            scale: _logoScale,
                            child: Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(32),
                                gradient: const LinearGradient(
                                  colors: [Colors.white, Color(0xFFF0FFF4)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.25),
                                    blurRadius: 32,
                                    offset: const Offset(0, 12),
                                  ),
                                  BoxShadow(
                                    color: const Color(0xFF52B788).withOpacity(0.4),
                                    blurRadius: 20,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(32),
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    const Text('🤝', style: TextStyle(fontSize: 56)),
                                    // Shimmer overlay
                                    AnimatedBuilder(
                                      animation: _shimmer,
                                      builder: (_, __) => Transform.translate(
                                        offset: Offset(_shimmer.value * 110, 0),
                                        child: Container(
                                          width: 40,
                                          height: 110,
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              colors: [
                                                Colors.white.withOpacity(0),
                                                Colors.white.withOpacity(0.4),
                                                Colors.white.withOpacity(0),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Tên app
                  AnimatedBuilder(
                    animation: _textController,
                    builder: (_, __) => Transform.translate(
                      offset: Offset(0, _titleSlide.value),
                      child: FadeTransition(
                        opacity: _titleFade,
                        child: const Text(
                          'Trao Tay',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 1.5,
                            shadows: [
                              Shadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 2)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Tagline
                  FadeTransition(
                    opacity: _subtitleFade,
                    child: const Text(
                      'Đồ cũ người này, Báu vật người kia',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white70,
                        letterSpacing: 0.5,
                        fontWeight: FontWeight.w300,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Progress bar ở dưới
            Positioned(
              bottom: 60,
              left: size.width * 0.25,
              right: size.width * 0.25,
              child: Column(
                children: [
                  AnimatedBuilder(
                    animation: _progress,
                    builder: (_, __) => ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _progress.value,
                        backgroundColor: Colors.white.withOpacity(0.2),
                        valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                        minHeight: 2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
