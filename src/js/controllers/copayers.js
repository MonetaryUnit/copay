'use strict';

angular.module('copayApp.controllers').controller('copayersController',
  function($scope, $rootScope, $timeout, $log, $modal, profileService, go, notification, isCordova, gettext, gettextCatalog) {
    var self = this;

    var delete_msg = gettextCatalog.getString('Are you sure you want to delete this wallet?');
    var accept_msg = gettextCatalog.getString('Accept');
    var cancel_msg = gettextCatalog.getString('Cancel');
    var confirm_msg = gettextCatalog.getString('Confirm');

    self.init = function() {
      var fc = profileService.focusedClient;
      if (fc.isComplete()) {
        $log.debug('Wallet Complete...redirecting')
        go.walletHome();
        return;
      }
      self.loading = false;
      self.isCordova = isCordova;
    };

    var _modalDeleteWallet = function() {
      var ModalInstanceCtrl = function($scope, $modalInstance, gettext) {
        $scope.title = delete_msg;
        $scope.loading = false;

        $scope.ok = function() {
          $scope.loading = true;
          $modalInstance.close(accept_msg);

        };
        $scope.cancel = function() {
          $modalInstance.dismiss(cancel_msg);
        };
      };

      var modalInstance = $modal.open({
        templateUrl: 'views/modals/confirmation.html',
        windowClass: 'full',
        controller: ModalInstanceCtrl
      });
      modalInstance.result.then(function(ok) {
        if (ok) {
          _deleteWallet();
        }
      });
    };

    var _deleteWallet = function() {
      var fc = profileService.focusedClient;
      $timeout(function() {
        var fc = profileService.focusedClient;
        var walletName = fc.credentials.walletName;

        profileService.deleteWalletFC({}, function(err) {
          if (err) {
            this.error = err.message || err;
            console.log(err);
            $timeout(function() {
              $scope.$digest();
            });
          } else {
            go.walletHome();
            $timeout(function() {
              notification.success(gettextCatalog.getString('Success'), gettextCatalog.getString('The wallet "{{walletName}}" was deleted', {walletName: walletName}));
            });
          }
        });
      }, 100);
    };

    self.deleteWallet = function() {
      var fc = profileService.focusedClient;
      if (isCordova) {
        navigator.notification.confirm(
          delete_msg,
          function(buttonIndex) {
            if (buttonIndex == 1) {
              _deleteWallet();
            }
          },
          confirm_msg, [accept_msg, cancel_msg]
        );
      } else {
        _modalDeleteWallet();
      }
    };

    self.copySecret = function(secret) {
      if (isCordova) {
        window.cordova.plugins.clipboard.copy(secret);
        window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
      }
    };

    self.shareSecret = function(secret) {
      if (isCordova) {
        if (isMobile.Android() || isMobile.Windows()) {
          window.ignoreMobilePause = true;
        }
        var message = gettextCatalog.getString('Join my Copay wallet. Here is the invitation code: {{secret}}  You can download Copay for your phone or desktop at https://copay.io', {secret: secret});
        window.plugins.socialsharing.share(message, gettextCatalog.getString('Invitation to share a Copay Wallet'), null, null);
      }
    };

  });
