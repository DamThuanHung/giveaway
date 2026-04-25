import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

/// Wrapper Firebase Analytics — chỉ track event quan trọng, schema cố định
/// để dashboard Firebase dễ phân tích.
///
/// Thêm event mới: định nghĩa method ở đây, không gọi `_analytics.logEvent`
/// trực tiếp ở screen → đảm bảo naming convention.
class Analytics {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  static FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: _analytics);

  // ─── User identity ──────────────────────────────────────────────
  static Future<void> setUser(String userId) async {
    if (kIsWeb) return;
    await _analytics.setUserId(id: userId);
  }

  static Future<void> clearUser() async {
    if (kIsWeb) return;
    await _analytics.setUserId(id: null);
  }

  // ─── Acquisition / Activation ───────────────────────────────────
  static Future<void> signUp({required String method}) async {
    // method: phone | email_otp | email_password
    await _analytics.logSignUp(signUpMethod: method);
  }

  static Future<void> login({required String method}) async {
    await _analytics.logLogin(loginMethod: method);
  }

  static Future<void> completeProfile() async {
    await _analytics.logEvent(name: 'complete_profile');
  }

  // ─── Engagement core (marketplace activity) ─────────────────────
  static Future<void> postCreate({
    required String category,
    required String listingType, // sell | give | free
    required int imageCount,
  }) async {
    await _analytics.logEvent(name: 'post_create', parameters: {
      'category': category,
      'listing_type': listingType,
      'image_count': imageCount,
    });
  }

  static Future<void> postView({required String postId}) async {
    await _analytics.logEvent(name: 'post_view', parameters: {'post_id': postId});
  }

  static Future<void> search({required String keyword, required int resultCount}) async {
    await _analytics.logSearch(searchTerm: keyword, parameters: {
      'result_count': resultCount,
    });
  }

  static Future<void> dealCreate({required String postId}) async {
    await _analytics.logEvent(name: 'deal_create', parameters: {'post_id': postId});
  }

  static Future<void> dealComplete({required String dealId}) async {
    await _analytics.logEvent(name: 'deal_complete', parameters: {'deal_id': dealId});
  }

  static Future<void> reviewSubmit({required int rating}) async {
    await _analytics.logEvent(name: 'review_submit', parameters: {'rating': rating});
  }

  // ─── Monetization ───────────────────────────────────────────────
  static Future<void> bumpInitiate({required String tier, required int amount}) async {
    // tier: free | plus_3d | vip_7d
    await _analytics.logEvent(name: 'bump_initiate', parameters: {
      'tier': tier,
      'amount': amount,
    });
  }

  static Future<void> bumpComplete({required String tier, required int amount}) async {
    await _analytics.logPurchase(
      currency: 'VND',
      value: amount.toDouble(),
      parameters: {'tier': tier},
    );
  }

  // ─── Social ─────────────────────────────────────────────────────
  static Future<void> followUser({required String targetUserId}) async {
    await _analytics.logEvent(name: 'follow_user', parameters: {'target': targetUserId});
  }

  static Future<void> chatMessageSend({required String roomId}) async {
    await _analytics.logEvent(name: 'chat_message_send', parameters: {'room_id': roomId});
  }
}
