/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, NativeModules, NativeEventEmitter, ActivityIndicator, Button, TextInput} from 'react-native';

// Import in the MyFiziq SDK plugin
var MyFiziq = NativeModules.RNMyFiziqSdk;
var MyFiziqEvent = new NativeEventEmitter(MyFiziq);

// Setup MyFiziq service
// NOTE: Replace the KEY, SECRET, and ENVIRONMENT strings with values given by MyFiziq
async function myfiziqSetup(callback) {
  try {
    let mfzState = await MyFiziq.mfzSdkStatusConnection();
    if (mfzState == 0) {
      let result = await MyFiziq.mfzSdkSetup(
        "REPLACE ME WITH KEY", 
        "REPLACE ME WITH SECRET", 
        "REPLACE ME WITH ENVIRONMENT");
      if (callback) callback(result);
    } else {
      if (callback) callback(null);
    }
  } catch(e) {
    if (callback) callback("Error");
  }
}

// Create the user auth response
async function myfiziqAuthResponse(callback) {
  // Check if user is logged in
  try {
    let isLoggedIn = await MyFiziq.mfzCognitoUserSignedIn();
    let cognitoIDPKey = await MyFiziq.mfzSdkCognitoUserPoolLoginsKey();
    if (isLoggedIn && cognitoIDPKey) {
      let userIdToken = await MyFiziq.mfzCognitoUserToken();
      if (callback) callback(cognitoIDPKey, userIdToken);
    } else {
      throw "User not logged in"
    }
  } catch(e) {
    if (callback) callback(null, null);
  }
}

// Answer MyFiziq event requests
MyFiziqEvent.addListener('myfiziqGetAuthToken', (data) => {
  // Answer with idP service user authentication token, as per AWS Cognito OpenID mapping.
  // See: https://docs.aws.amazon.com/cognito/latest/developerguide/open-id.html
  // This example uses the MyFiziq provided Cognito UserPool for demonstration.
  myfiziqAuthResponse((key, token) => {
    MyFiziq.mfzSdkAnswerLogins(key, token);
  });
});

// Cognito User Pool login
async function myfiziqUserLogin(email, pass, callback) {
  try {
    // Login to the idP
    let loginResult = await MyFiziq.mfzCognitoUserLogin(email, pass);
    // Login was successful, so announce to MyFiziq service
    let myqLogin = await MyFiziq.mfzUserLogin(email);
    // Done
    if (callback) callback(null);
  } catch(e) {
    if (callback) callback(e);
  }
}

// Initiate the Capture Process
async function myfiziqInitiateCaptureProcess(heightCm, weightKg, gender, callback) {
  try {
    // Update user intrinsics
    let userSetHeight = await MyFiziq.mfzUserSetHeightInCm(heightCm); // expect float between 50-300
    let userSetWeight = await MyFiziq.mfzUserSetWeightInKg(weightKg); // expect float between 17-300
    let userSetGender = await MyFiziq.mfzUserSetGender(gender);       // expect string of either "male" or "female"
    let userSetUpdate = await MyFiziq.mfzUserUpdateDetails();
    // Start the Capture Process
    let captureProcess = await MyFiziq.mfzSdkInitiateAvatarCreation();
    // Done
    if (callback) callback(null);
  } catch(e) {
    if (callback) callback(e);
  }
}

type Props = {};
export default class App extends Component<Props> {

  state = {
    myfiziqIsReady: false,
    myfiziqUserSignedIn: false,
    userEmail: '',
    userPass: '',
    userLoggingIn: false
  }

  // Initialize MyFiziq service on App startup via the App class Constructor.
  constructor(props) {
    super(props);
    myfiziqSetup((error) => {
      if (error == null) {
        this.setState({myfiziqIsReady: true});
      }
    });
  }

  // Button actions

  onPressLogin = () => {
    this.setState({userLoggingIn: true, myfiziqUserSignedIn: false});
    myfiziqUserLogin(this.state.userEmail, this.state.userPass, (error) => {
      if (error == null) {
        this.setState({userLoggingIn: false, myfiziqUserSignedIn: true, myfiziqIsReady: true});
      }
    });
  }

  onPressNewAvatar = () => {
    // Show the spinner whilst process initiates
    this.setState({myfiziqIsReady: false});
    myfiziqInitiateCaptureProcess(189.0, 89.0, "male", (error) => {
      if (error == null) {
        this.setState({myfiziqIsReady: true});
      }
    });
  }

  // Render methods

  _renderLoading() {
    if (this.state.myfiziqIsReady == true && this.state.userLoggingIn == false) {
      return null;
    }
    // Show Activity Indicator whilst loading
    return (
      <ActivityIndicator size="large" color="#000000" />
    );
  }

  _renderLandingPage() {
    if (this.state.myfiziqUserSignedIn == true || this.state.myfiziqIsReady == false || this.state.userLoggingIn == true) {
      return null;
    }
    // Show login form
    return (
      <>
      <Text>User Sign In</Text>
      <View style={{height: 30, width: 50}} />
      <TextInput 
        style={{height: 40, width: 220, backgroundColor: '#eeeeee'}}
        onChangeText={(text) => this.setState({userEmail: text})}
        editable={true}
        value={this.state.userEmail}
        textContentType={'emailAddress'}
        autoCapitalize={'none'}
        placeholder={'Email'}
      />
      <View style={{height: 5, width: 50}} />
      <TextInput 
        style={{height: 40, width: 220, backgroundColor: '#eeeeee'}}
        onChangeText={(text) => this.setState({userPass: text})}
        editable={true}
        value={this.state.userPass}
        secureTextEntry={true}
        textContentType={'password'}
        autoCompleteType={'off'}
        autoCapitalize={'none'}
        placeholder={'Password'}
      />
      <View style={{height: 60, width: 50}} />
      <Button
        onPress={this.onPressLogin}
        title='LOGIN'
        color='#22aa11'
      />
      </>
    );
  }

  _renderHomePage() {
    if (this.state.myfiziqUserSignedIn == false || this.state.myfiziqIsReady == false) {
      return null;
    }
    // Show Home view, which shows the latest result and option to initiate new capture process
    return(
      <>
      <Button
        onPress={this.onPressNewAvatar}
        title='NEW AVATAR'
        color='#aaaa11'
      />
      </>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        {this._renderLoading()}
        {this._renderLandingPage()}
        {this._renderHomePage()}
      </View>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
