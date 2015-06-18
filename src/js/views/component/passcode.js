var React = require('react'),
	Dialogs = require('touchstonejs').Dialogs,
	Navigation = require('touchstonejs').Navigation,
	Link = require('touchstonejs').Link,
	UI = require('touchstonejs').UI;

module.exports = React.createClass({
	mixins: [Navigation, Dialogs],

	getInitialState: function () {
		return {}
	},

	handlePasscode: function (passcode) {
		alert('Your passcode is "' + passcode + '".');

		this.showView('home', 'fade');
	},

	render: function () {
		return (
			<UI.View>
				<UI.Headerbar type="default" label="Enter Passcode">
					<Link to="home" viewTransition="reveal-from-right" className="Headerbar-button ion-chevron-left" component="button">Back</Link>
				</UI.Headerbar>
				<UI.Passcode action={this.handlePasscode} helpText="Enter a passcode" />
			</UI.View>
		);
	}
});
