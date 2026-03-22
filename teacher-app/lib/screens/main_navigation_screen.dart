import 'package:flutter/material.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../theme/design_system.dart';
import '../providers/localization_provider.dart';
import 'home_screen.dart';
import 'exams_screen.dart';
import 'posts_screen.dart';
import 'teacher_students_screen.dart';
// Removed chats and settings from bottom navigation

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

  @override
  void initState() {
    super.initState();
    _screens = [
      const HomeScreen(),
      const PostsScreen(),
      const TeacherStudentsScreen(),
      const ExamsScreen(),
    ];

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _iconAnimationControllers = List.generate(
      4,
      (index) => AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      ),
    );

    // Animate the initial selected tab
    _iconAnimationControllers[0].forward();
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
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: DSColors.white,
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
                    icon: LineAwesomeIcons.users_solid,
                    activeIcon: LineAwesomeIcons.users_solid,
                    label: context.tr('navigation.students'),
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
          // Animations removed to avoid bottom bar "jumping" effect

          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: isActive
                  ? color.withValues(alpha: 0.12)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(DSRadii.medium),
              boxShadow: isActive
                  ? const [DSShadows.micro, DSShadows.nano]
                  : null,
            ),
            constraints: const BoxConstraints(maxHeight: 60),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: isActive ? color : DSColors.darkGray,
                  size: 20,
                ),
                const SizedBox(height: 2),
                // Label with animation (no size/weight change to prevent jumping)
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: TextStyle(
                    color: isActive ? color : DSColors.darkGray,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                    shadows: isActive
                        ? const [
                            Shadow(
                              color: Color(0x33000000),
                              blurRadius: 3,
                              offset: Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // Active indicator dot (fixed size, fade only)
                const SizedBox(height: 2),
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 200),
                  opacity: isActive ? 1 : 0,
                  child: Container(
                    width: 2,
                    height: 2,
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(1.5),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
