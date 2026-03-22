import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../theme/design_system.dart';
import 'posts_screen.dart';
import 'grades_screen.dart';
import 'exams_screen.dart';
import 'attendance_screen.dart';
import '../providers/localization_provider.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen>
    with TickerProviderStateMixin {
  int _currentIndex = 0;
  late AnimationController _animationController;
  late List<AnimationController> _iconAnimationControllers;

  late final List<Widget> _screens;
  bool _isUiReady = false;

  @override
  void initState() {
    super.initState();
    _screens = [
      const HomeScreen(),
      const PostsScreen(),
      const GradesScreen(),
      const ExamsScreen(),
      const AttendanceScreen(),
    ];

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _iconAnimationControllers = List.generate(
      5,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      ),
    );

    // Animate the initial selected tab
    _iconAnimationControllers[0].forward();

    // Defer heavy UI until first frame to avoid build jank after refresh
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        setState(() {
          _isUiReady = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    for (var controller in _iconAnimationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (_currentIndex != index) {
      // Animate out current tab
      _iconAnimationControllers[_currentIndex].reverse();

      setState(() {
        _currentIndex = index;
      });

      // Animate in new tab
      _iconAnimationControllers[index].forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isUiReady
          ? IndexedStack(index: _currentIndex, children: _screens)
          : const Center(child: CircularProgressIndicator()),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              offset: const Offset(0, -8),
              blurRadius: 28,
              spreadRadius: 0,
            ),
          ],
        ),
        child: SafeArea(
          child: Container(
            constraints: const BoxConstraints(minHeight: 70, maxHeight: 76),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: _buildNavItem(
                    icon: LineAwesomeIcons.home_solid,
                    activeIcon: LineAwesomeIcons.home_solid,
                    label: context.tr('navigation.home'),
                    index: 0,
                    color: DSColors.primary,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    icon: LineAwesomeIcons.chalkboard_teacher_solid,
                    activeIcon: LineAwesomeIcons.chalkboard_teacher_solid,
                    label: context.tr('navigation.posts'),
                    index: 1,
                    color: DSColors.primary,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    icon: LineAwesomeIcons.award_solid,
                    activeIcon: LineAwesomeIcons.award_solid,
                    label: context.tr('navigation.grades'),
                    index: 2,
                    color: DSColors.primary,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    icon: LineAwesomeIcons.newspaper_solid,
                    activeIcon: LineAwesomeIcons.newspaper_solid,
                    label: context.tr('navigation.exams'),
                    index: 3,
                    color: DSColors.primary,
                  ),
                ),
                Expanded(
                  child: _buildNavItem(
                    icon: LineAwesomeIcons.clipboard_check_solid,
                    activeIcon: LineAwesomeIcons.clipboard_check_solid,
                    label: context.tr('navigation.attendance'),
                    index: 4,
                    color: DSColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required IconData activeIcon,
    required String label,
    required int index,
    required Color color,
  }) {
    final isActive = _currentIndex == index;
    final animationController = _iconAnimationControllers[index];

    return GestureDetector(
      onTap: () => _onTabTapped(index),
      child: AnimatedBuilder(
        animation: animationController,
        builder: (context, child) {
          final scaleAnimation = Tween<double>(begin: 1.0, end: 1.05).animate(
            CurvedAnimation(
              parent: animationController,
              curve: Curves.elasticOut,
            ),
          );

          final slideAnimation = Tween<double>(begin: 0.0, end: -1.0).animate(
            CurvedAnimation(parent: animationController, curve: Curves.easeOut),
          );

          return Transform.scale(
            scale: scaleAnimation.value,
            child: Transform.translate(
              offset: Offset(0, slideAnimation.value),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? color.withValues(alpha: 0.10)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isActive
                      ? [
                          BoxShadow(
                            color: DSColors.primary.withValues(alpha: 0.12),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : const [],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isActive ? activeIcon : icon,
                      color: isActive ? color : Colors.grey.shade700,
                      size: 22,
                    ),
                    const SizedBox(height: 1),
                    AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 200),
                      style: TextStyle(
                        color: isActive ? color : Colors.grey.shade600,
                        fontSize: 11,
                        fontWeight: isActive
                            ? FontWeight.w600
                            : FontWeight.w500,
                      ),
                      child: Text(
                        label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        // Keep legible contrast on active pill
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
