import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError('DefaultFirebaseOptions không hỗ trợ platform này');
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCQPer6nJ9A-W7qwwOIm_x6r_20aYjNs1c',
    appId: '1:734551474520:android:ebea903ca94493c0fde52d',
    messagingSenderId: '734551474520',
    projectId: 'chovatang-b5bd9',
    storageBucket: 'chovatang-b5bd9.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCTDr6K2yKhR6-MP_eKUzJQi_gWeaBmVO4',
    appId: '1:734551474520:ios:dad0e64f52775f80fde52d',
    messagingSenderId: '734551474520',
    projectId: 'chovatang-b5bd9',
    storageBucket: 'chovatang-b5bd9.firebasestorage.app',
    iosBundleId: 'vn.traotay.app',
  );
}
